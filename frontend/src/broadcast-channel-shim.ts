// Shim for broadcast-channel to prevent infinite loop in Firefox
// RxDB imports this but we use multiInstance: false so it's not needed

export class BroadcastChannel {
  name: string
  constructor(name: string) {
    this.name = name
  }
  postMessage(_msg: any) {}
  close() {}
  set onmessage(_fn: any) {}
  addEventListener(_type: string, _fn: any) {}
  removeEventListener(_type: string, _fn: any) {}
}

export function createLeaderElection(_channel: any) {
  return {
    awaitLeadership: () => Promise.resolve(true),
    die: () => Promise.resolve(),
    hasLeader: false,
    isLeader: true,
    onduplicate: () => {},
  }
}

export function enforceOptions() {
  return {}
}

export default BroadcastChannel
