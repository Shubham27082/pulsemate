import { View, StyleSheet } from 'react-native';
import { colors, shadow, radius } from '../theme';

export default function Card({ children, style, variant = 'default' }) {
  return (
    <View style={[s.card, variant === 'flat' && s.flat, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
