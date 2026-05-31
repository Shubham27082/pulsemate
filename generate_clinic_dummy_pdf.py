from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


OUTPUT_FILE = "clinic_dummy_data.pdf"


clinics = [
    {
        "name": "Sunrise Multispecialty Clinic",
        "fields": [
            ("Owner Name", "Rahul Sharma"),
            ("Phone", "+919876543210"),
            ("Email", "owner.sunriseclinic@example.com"),
            ("Password", "Test@1234"),
            ("Confirm Password", "Test@1234"),
            ("Clinic Name", "Sunrise Multispecialty Clinic"),
            ("Clinic Type", "Multi-specialty Clinic"),
            ("Clinic Description", "Comprehensive family care with consultation and diagnostics."),
            ("Specialties", "General Medicine, Pediatrics, Cardiology"),
            ("Clinic Address", "24 MG Road"),
            ("Landmark", "Near City Hospital"),
            ("City", "Bengaluru"),
            ("State", "Karnataka"),
            ("Pincode", "560001"),
            ("Google Maps Location", "https://maps.google.com/?q=Sunrise+Multispecialty+Clinic"),
            ("Clinic Phone", "+918765432109"),
            ("Emergency Contact Number", "+919900112233"),
            ("Alternate Email", "support.sunriseclinic@example.com"),
            ("Clinic Registration Number", "REG-2026-001"),
            ("GST Number", "29ABCDE1234F1Z5"),
            ("PAN Number", "ABCDE1234F"),
        ],
    },
    {
        "name": "CarePoint Dental Studio",
        "fields": [
            ("Owner Name", "Priya Nair"),
            ("Phone", "+919812345678"),
            ("Email", "owner.carepoint@example.com"),
            ("Password", "Test@1234"),
            ("Confirm Password", "Test@1234"),
            ("Clinic Name", "CarePoint Dental Studio"),
            ("Clinic Type", "Dental Clinic"),
            ("Clinic Description", "Cosmetic dentistry, root canal, and preventive dental care."),
            ("Specialties", "Dental Surgery, Oral Medicine, Orthodontics"),
            ("Clinic Address", "18 Sector 12"),
            ("Landmark", "Opposite Metro Station"),
            ("City", "Kochi"),
            ("State", "Kerala"),
            ("Pincode", "682001"),
            ("Google Maps Location", "https://maps.google.com/?q=CarePoint+Dental+Studio"),
            ("Clinic Phone", "+918123456789"),
            ("Emergency Contact Number", "+919800223344"),
            ("Alternate Email", "hello.carepoint@example.com"),
            ("Clinic Registration Number", "REG-2026-002"),
            ("GST Number", "32ABCDE1234F1Z5"),
            ("PAN Number", "BCDEF2345G"),
        ],
    },
    {
        "name": "NewLife Pediatrics",
        "fields": [
            ("Owner Name", "Amit Verma"),
            ("Phone", "+919701234567"),
            ("Email", "owner.newlife@example.com"),
            ("Password", "Test@1234"),
            ("Confirm Password", "Test@1234"),
            ("Clinic Name", "NewLife Pediatrics"),
            ("Clinic Type", "Individual Clinic"),
            ("Clinic Description", "Pediatric consultation, vaccinations, and child wellness checks."),
            ("Specialties", "Pediatrics, Neonatology"),
            ("Clinic Address", "41 Lake View Road"),
            ("Landmark", "Near Green Park"),
            ("City", "Pune"),
            ("State", "Maharashtra"),
            ("Pincode", "411001"),
            ("Google Maps Location", "https://maps.google.com/?q=NewLife+Pediatrics"),
            ("Clinic Phone", "+918901234567"),
            ("Emergency Contact Number", "+919811223344"),
            ("Alternate Email", "care.newlife@example.com"),
            ("Clinic Registration Number", "REG-2026-003"),
            ("GST Number", "27ABCDE1234F1Z5"),
            ("PAN Number", "CDEFG3456H"),
        ],
    },
    {
        "name": "Metro Care Diagnostics",
        "fields": [
            ("Owner Name", "Sandeep Iyer"),
            ("Phone", "+919654321098"),
            ("Email", "owner.metrocare@example.com"),
            ("Password", "Test@1234"),
            ("Confirm Password", "Test@1234"),
            ("Clinic Name", "Metro Care Diagnostics"),
            ("Clinic Type", "Diagnostic Center"),
            ("Clinic Description", "Blood tests, imaging, and preventive health screening."),
            ("Specialties", "Pathology, Radiology, General Medicine"),
            ("Clinic Address", "7 Industrial Area"),
            ("Landmark", "Behind Central Mall"),
            ("City", "Hyderabad"),
            ("State", "Telangana"),
            ("Pincode", "500081"),
            ("Google Maps Location", "https://maps.google.com/?q=Metro+Care+Diagnostics"),
            ("Clinic Phone", "+917654321098"),
            ("Emergency Contact Number", "+919877665544"),
            ("Alternate Email", "info.metrocare@example.com"),
            ("Clinic Registration Number", "REG-2026-004"),
            ("GST Number", "36ABCDE1234F1Z5"),
            ("PAN Number", "DEFGH4567I"),
        ],
    },
    {
        "name": "Harmony Physiotherapy Center",
        "fields": [
            ("Owner Name", "Neha Joshi"),
            ("Phone", "+919543210987"),
            ("Email", "owner.harmony@example.com"),
            ("Password", "Test@1234"),
            ("Confirm Password", "Test@1234"),
            ("Clinic Name", "Harmony Physiotherapy Center"),
            ("Clinic Type", "Physiotherapy Center"),
            ("Clinic Description", "Pain relief, rehabilitation, and sports injury recovery."),
            ("Specialties", "Physiotherapy, Orthopedics, Rehabilitation"),
            ("Clinic Address", "12 Park Avenue"),
            ("Landmark", "Near Community Hall"),
            ("City", "Ahmedabad"),
            ("State", "Gujarat"),
            ("Pincode", "380015"),
            ("Google Maps Location", "https://maps.google.com/?q=Harmony+Physiotherapy+Center"),
            ("Clinic Phone", "+918543210987"),
            ("Emergency Contact Number", "+919922334455"),
            ("Alternate Email", "hello.harmony@example.com"),
            ("Clinic Registration Number", "REG-2026-005"),
            ("GST Number", "24ABCDE1234F1Z5"),
            ("PAN Number", "EFGHI5678J"),
        ],
    },
]


def make_doc():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtleCenter",
            parent=styles["BodyText"],
            alignment=TA_CENTER,
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ClinicName",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#2563EB"),
            spaceBefore=8,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FieldName",
            parent=styles["BodyText"],
            fontSize=8.8,
            leading=11,
            textColor=colors.HexColor("#334155"),
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FieldValue",
            parent=styles["BodyText"],
            fontSize=8.8,
            leading=11,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=0,
        )
    )

    story = []
    story.append(Paragraph("PulseMate Clinic Registration Dummy Data", styles["TitleCenter"]))
    story.append(Paragraph("Five fictional clinic records for testing the multi-step registration form.", styles["SubtleCenter"]))
    story.append(Spacer(1, 4))

    for index, clinic in enumerate(clinics, start=1):
      story.append(Paragraph(f"{index}. {clinic['name']}", styles["ClinicName"]))

      rows = []
      for label, value in clinic["fields"]:
          rows.append([
              Paragraph(f"<b>{label}</b>", styles["FieldName"]),
              Paragraph(str(value), styles["FieldValue"]),
          ])

      table = Table(rows, colWidths=[55 * mm, 110 * mm], repeatRows=0)
      table.setStyle(
          TableStyle(
              [
                  ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                  ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#CBD5E1")),
                  ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                  ("VALIGN", (0, 0), (-1, -1), "TOP"),
                  ("LEFTPADDING", (0, 0), (-1, -1), 6),
                  ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                  ("TOPPADDING", (0, 0), (-1, -1), 5),
                  ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                  ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
              ]
          )
      )
      story.append(table)
      if index != len(clinics):
          story.append(Spacer(1, 8))
          story.append(PageBreak())

    doc.build(story)


if __name__ == "__main__":
    make_doc()
    print(f"Created {OUTPUT_FILE}")
