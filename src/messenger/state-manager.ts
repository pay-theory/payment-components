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
      MessengerState.IDLE, // Allow reset to idle for cleanup
    ],
    [MessengerState.REFRESHING]: [MessengerState.CONNECTED, MessengerState.ERROR],
    [MessengerState.PROCESSING]: [
      MessengerState.COMPLETED,
      MessengerState.CONNECTED,
      MessengerState.ERROR,
    ],
    [MessengerState.COMPLETED]: [MessengerState.CONNECTED, MessengerState.IDLE],
    [MessengerState.ERROR]: [
      MessengerState.IDLE,
      MessengerState.INITIALIZING,
      MessengerState.REFRESHING, // Allow direct refresh from error
      MessengerState.FAILED,
    ],
    [MessengerState.FAILED]: [MessengerState.IDLE, MessengerState.REFRESHING],
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

  /**
   * Execute an operation with automatic state management
   * Ensures state transitions are handled correctly even if errors occur
   */
  async withStateGuard<T>(
    processingState: MessengerState,
    successState: MessengerState,
    errorState: MessengerState,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previousState = this.currentState;

    // Attempt to transition to processing state
    if (!this.setState(processingState)) {
      throw new Error(`Cannot transition from ${previousState} to ${processingState}`);
    }

    try {
      const result = await operation();

      // On success, transition to success state
      if (!this.setState(successState)) {
        console.warn(
          `Could not transition to success state ${successState}, current: ${this.currentState}`,
        );
      }

      return result;
    } catch (error) {
      // On error, ensure we transition to error state
      if (!this.setState(errorState)) {
        console.warn(
          `Could not transition to error state ${errorState}, current: ${this.currentState}`,
        );
      }
      throw error;
    }
  }
}

export default StateManager;
