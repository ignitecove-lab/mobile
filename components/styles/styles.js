export const colors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#fff',
  text: '#333',
  shadow: '#000',
};

export const sizes = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
};

export const globalStyles = {
  container: {
    padding: sizes.medium,
    backgroundColor: colors.background,
  },
  text: {
    fontSize: sizes.medium,
    color: colors.text,
  },
  shadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
};
