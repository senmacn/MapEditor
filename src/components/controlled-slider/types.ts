export interface ControlledSliderAction {
  getValue(): number;
  zoomIn(): void;
  zoomOut(): void;
  setProps: (props: ControlledSliderProps) => void
}

export interface ControlledSliderProps {
  onChange?: (value: number) => void;
}
