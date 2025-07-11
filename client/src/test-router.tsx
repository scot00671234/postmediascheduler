// Simple test to isolate the wouter routing issue
import { Switch, Route, useLocation } from "wouter";

export function TestRouter() {
  try {
    const [location] = useLocation();
    console.log("Location:", location);
    
    return (
      <Switch>
        <Route path="/" component={() => <div>Home</div>} />
        <Route path="/test" component={() => <div>Test</div>} />
      </Switch>
    );
  } catch (error) {
    console.error("TestRouter error:", error);
    return <div>Router Error: {error.message}</div>;
  }
}