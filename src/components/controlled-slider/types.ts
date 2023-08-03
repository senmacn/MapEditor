export interface ControlledSliderAction {
  getValue(): number;
  zoomIn(): void;
  zoomOut(): void;
  setProps: (props: ControlledSliderProps) => void;
  setValue: (number) => void;
}

export interface ControlledSliderProps {
  onChange?: (value: number) => void;
}
