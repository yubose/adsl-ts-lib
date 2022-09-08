export enum ActionToken {
  Abort = 'Abort',
  Continue = 'Continue',
  Evaluate = 'Evaluate',
  Hold = 'Hold', // HoldActionToken
  Move = 'Move', // MoveToken
  Retrieve = 'Retrieve',
}

export enum HoldActionToken {
  Remove = 'Remove',
  Set = 'Set',
}

export enum MoveToken {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
  Next = 'Next',
}
