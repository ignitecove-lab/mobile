import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

const CustomBottomSheetModal = forwardRef(
  (
    {
      snapPoints = ["50%", "70%"],
      onChange,
      children,
      backgroundColor = "#D8434E",
      refreshing = false,
    },
    ref
  ) => {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        onChange={onChange}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor,
        }}
      >
        <BottomSheetScrollView
          style={styles.bottomContentContainer}
          refreshing={refreshing}
          keyboardShouldPersistTaps="always"
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomContentContainer: {
    flex: 1,
  },
});

export default CustomBottomSheetModal;
