export enum MessengerState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  CONNECTED = 'connected',
  REFRESHING = 'refreshing',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  FAILED = 'failed',
}

type StateTransition = {
  [key in MessengerState]: MessengerState[];
};

class StateManager {
  private currentState: MessengerState = MessengerState.IDLE;
  private stateHistory: MessengerState[] = [MessengerState.IDLE];
  private stateChangeCallbacks: ((state: MessengerState, prevState: MessengerState) => void)[] = [];

  // Define valid state transitions
  private validTransitions: StateTransition = {
    [MessengerState.IDLE]: [MessengerState.INITIALIZING, MessengerState.ERROR],
    [MessengerState.INITIALIZING]: [MessengerState.CONNECTED, MessengerState.ERROR],
    [MessengerState.CONNECTED]: [
      MessengerState.PROCESSING,
      MessengerState.REFRESHING,
      MessengerState.ERROR,
    ],
    [MessengerState.REFRESHING]: [MessengerState.CONNECTED, MessengerState.ERROR],
    [MessengerState.PROCESSING]: [
      MessengerState.COMPLETED,
      MessengerState.CONNECTED,
      MessengerState.ERROR,
    ],
    [MessengerState.COMPLETED]: [MessengerState.IDLE],
    [MessengerState.ERROR]: [
      MessengerState.IDLE,
      MessengerState.INITIALIZING,
      MessengerState.FAILED,
    ],
    [MessengerState.FAILED]: [MessengerState.IDLE],
  };

  /**
   * Get current state
   */
  getState(): MessengerState {
    return this.currentState;
  }

  /**
   * Set new state
   */
  setState(newState: MessengerState): boolean {
    // Check if transition is valid
    if (!this.validTransitions[this.currentState].includes(newState)) {
      console.warn(`Invalid state transition from ${this.currentState} to ${newState}`);
      return false;
    }

    const prevState = this.currentState;
    this.currentState = newState;
    this.stateHistory.push(newState);

    // Call callbacks
    for (const callback of this.stateChangeCallbacks) {
      try {
        callback(newState, prevState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    }

    return true;
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: MessengerState, prevState: MessengerState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Get state history
   */
  getStateHistory(): MessengerState[] {
    return [...this.stateHistory];
  }
}

export default StateManager;
