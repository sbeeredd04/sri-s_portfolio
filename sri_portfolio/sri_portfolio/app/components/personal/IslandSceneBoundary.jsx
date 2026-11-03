"use client";
import { Component } from "react";
// Keep the independently rendered reading/navigation links available if a
// renderer or asset fails. The parent supplies its existing reading route.
export default class IslandSceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onUnavailable?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
