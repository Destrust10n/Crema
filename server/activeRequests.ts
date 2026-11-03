/**
 * Tracks currently active in-flight requests to enforce:
 * 1. Fresh requestId per request; reject duplicate ID only while the first is running.
 * 2. Automatic release of active request records upon completion or abort.
 */
class ActiveRequestManager {
  private activeRequestIds = new Set<string>();

  /**
   * Acquires a request ID lock. Returns true if acquired, false if a request with this ID is already in flight.
   */
  public acquire(requestId: string): boolean {
    if (!requestId) return true; // Generate or allow untracked if not provided
    if (this.activeRequestIds.has(requestId)) {
      return false;
    }
    this.activeRequestIds.add(requestId);
    return true;
  }

  /**
   * Releases the request ID lock.
   */
  public release(requestId: string): void {
    if (!requestId) return;
    this.activeRequestIds.delete(requestId);
  }

  public isRunning(requestId: string): boolean {
    return this.activeRequestIds.has(requestId);
  }

  public getActiveCount(): number {
    return this.activeRequestIds.size;
  }
}

export const activeRequestManager = new ActiveRequestManager();
