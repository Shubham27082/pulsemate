const crypto = require('crypto');
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { notifyAppointmentBooked } = require('../services/notification.service');

// ─── Fixed booking fee ────────────────────────────────────────────────────────
// This is the platform booking charge — NOT the consultation fee.
// Consultation fee is paid directly at the clinic.
const BOOKING_FEE = 10; // ₹10 fixed

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Assign queue number and create queue item for an offline appointment.
 * Called only after payment is confirmed.
 */
const assignQueueAndConfirm = async (appointment, doctorClinic, io) => {
  const avgMins = doctorClinic?.avgConsultationMins || 10;

  if (appointment.appointmentType === 'OFFLINE') {
    // Use UTC midnight to match how getTodayAppointments and getQueue compute "today"
    const day = new Date(appointment.appointmentDate);
    day.setUTCHours(0, 0, 0, 0);

    let queue = await prisma.queue.findFirst({
      where: { clinicId: appointment.clinicId, doctorId: appointment.doctorId, date: day },
    });
    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          clinicId: appointment.clinicId,
          doctorId: appointment.doctorId,
          date: day,
          status: 'ACTIVE',
        },
      });
    }

    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    const waitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING' },
    });

    // Update appointment with queue number and confirm it
    const confirmed = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'BOOKED',
        queueNumber,
        estimatedWaitMinutes: (waitingCount + 1) * avgMins,
      },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        clinic: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        queueNumber,
        status: 'WAITING',
        position: waitingCount + 1,
      },
    });

    // Emit socket event so doctor/reception panels refresh live
    if (io) {
      const today = new Date(appointment.appointmentDate).toISOString().split('T')[0];
      const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'APPOINTMENT_BOOKED',
        appointmentId: appointment.id,
        queueNumber,
      });
    }

    return confirmed;
  }

  // Online appointment — just confirm
  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'BOOKED' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      clinic: { select: { id: true, name: true, address: true, city: true } },
    },
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/payments/initiate
 *
 * Step 1 of the new booking flow:
 *   - Validates doctor/clinic/date
 *   - Creates appointment with status PENDING_PAYMENT
 *   - Creates Razorpay order
 *   - Returns order details to frontend
 *
 * Appointment is NOT confirmed until payment is verified.
 */
const initiatePayment = async (req, res, next) => {
  try {
    const {
      doctorId, clinicId, appointmentType,
      appointmentDate, slotTime, symptoms,
    } = req.body;

    // Validate doctor-clinic
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
      include: { doctor: true },
    });
    if (!doctorClinic) {
      return sendError(res, 'Doctor is not available at this clinic', 400);
    }

    // Check duplicate booking (ignore PENDING_PAYMENT ones — they may be abandoned)
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentDate: {
          gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
      },
    });
    if (existingBooking) {
      return sendError(res, 'You already have a confirmed appointment with this doctor on this date', 409);
    }

    const fee = BOOKING_FEE; // Fixed ₹10 booking charge

    // Create appointment in PENDING_PAYMENT state
    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        slotTime: slotTime || null,
        symptoms: symptoms || null,
        status: 'PENDING_PAYMENT',
      },
    });

    // ── Razorpay order ────────────────────────────────────────────────────
    let order, key, devMode = false;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Dev mode — mock order, no real payment needed
      order = {
        id: `order_dev_${Date.now()}`,
        amount: Math.round(fee * 100),
        currency: 'INR',
        receipt: appointment.id,
      };
      key = 'rzp_test_dev_mode';
      devMode = true;
    } else {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      order = await razorpay.orders.create({
        amount: Math.round(fee * 100),
        currency: 'INR',
        receipt: appointment.id,
        notes: { appointmentId: appointment.id, patientId: req.user.id },
      });
      key = process.env.RAZORPAY_KEY_ID;
    }

    // Create payment record in PENDING state
    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        patientId: req.user.id,
        amount: fee,
        status: 'PENDING',
        method: 'RAZORPAY',
        razorpayOrderId: order.id,
      },
    });

    return sendSuccess(res, {
      appointmentId: appointment.id,
      order,
      key,
      amount: fee,
      currency: 'INR',
      devMode,
      doctorName: doctorClinic.doctor?.user?.name,
    }, 'Payment order created');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 *
 * Step 2 of the booking flow:
 *   - Verifies Razorpay HMAC signature
 *   - Marks payment as PAID
 *   - Confirms appointment (BOOKED) + assigns queue number
 *   - Returns confirmed appointment
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
    });
    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }
    if (payment.status === 'PAID') {
      return sendError(res, 'Payment already verified', 409);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // ── Dev mode ──────────────────────────────────────────────────────────
    if (razorpayOrderId?.startsWith('order_dev_')) {
      await prisma.payment.update({
        where: { appointmentId },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpayPaymentId || `pay_dev_${Date.now()}`,
          razorpaySignature: razorpaySignature || 'dev_sig',
          paidAt: new Date(),
        },
      });

      const doctorClinic = await prisma.doctorClinic.findFirst({
        where: { doctorId: appointment.doctorId, clinicId: appointment.clinicId },
      });
      const io = req.app.get('io');
      const confirmed = await assignQueueAndConfirm(appointment, doctorClinic, io);

      // Fire-and-forget notification
      notifyAppointmentBooked(
        appointment.patientId,
        confirmed.doctor?.user?.name || 'the doctor',
        appointment.appointmentDate,
        confirmed.queueNumber
      ).catch(() => {});

      return sendSuccess(res, {
        verified: true,
        appointment: confirmed,
      }, 'Payment verified — appointment confirmed!');
    }

    // ── Real Razorpay signature verification ──────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await prisma.payment.update({
        where: { appointmentId },
        data: { status: 'FAILED' },
      });
      // Mark appointment as cancelled on payment failure
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });
      return sendError(res, 'Payment verification failed — invalid signature', 400);
    }

    // Mark payment paid
    await prisma.payment.update({
      where: { appointmentId },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
      },
    });

    // Confirm appointment + assign queue
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId: appointment.doctorId, clinicId: appointment.clinicId },
    });
    const io = req.app.get('io');
    const confirmed = await assignQueueAndConfirm(appointment, doctorClinic, io);

    notifyAppointmentBooked(
      appointment.patientId,
      confirmed.doctor?.user?.name || 'the doctor',
      appointment.appointmentDate,
      confirmed.queueNumber
    ).catch(() => {});

    return sendSuccess(res, {
      verified: true,
      appointment: confirmed,
    }, 'Payment verified — appointment confirmed!');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/cash
 * Receptionist records cash payment and confirms appointment.
 */
const markCashPayment = async (req, res, next) => {
  try {
    const { appointmentId, amount } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { select: { consultationFee: true } } },
    });
    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    const finalAmount = amount || appointment.doctor?.consultationFee || 0;

    const payment = await prisma.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        patientId: appointment.patientId,
        amount: finalAmount,
        status: 'PAID',
        method: 'CASH',
        paidAt: new Date(),
      },
      update: {
        status: 'PAID',
        method: 'CASH',
        amount: finalAmount,
        paidAt: new Date(),
      },
    });

    // Emit socket event so doctor/receptionist queue updates live
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'PAYMENT_RECORDED',
        appointmentId,
        method: 'CASH',
      });
    }

    return sendSuccess(res, { payment }, 'Cash payment recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/appointment/:appointmentId
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const payment = await prisma.payment.findUnique({ where: { appointmentId } });
    return sendSuccess(res, { payment: payment || null });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/my
 */
const getMyPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { patientId: req.user.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              status: true,
              queueNumber: true,
              doctor: { include: { user: { select: { name: true } } } },
              clinic: { select: { name: true, city: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where: { patientId: req.user.id } }),
    ]);

    return sendSuccess(res, { payments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  markCashPayment,
  getPaymentStatus,
  getMyPayments,
};
