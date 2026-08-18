import { IGActionInvocation, GActionId } from "../../../shared/contracts";

export interface ActionExecutionResult {
  actionId: GActionId;
  success: boolean;
  message: string;
}

/**
 * OCG Typed Website Action Registry
 * Central execution hub for all tool calls emitted by G Gateway.
 */
export class GActionRegistry {
  private static registeredListeners = new Set<(action: IGActionInvocation) => void>();

  public static subscribe(listener: (action: IGActionInvocation) => void): () => void {
    this.registeredListeners.add(listener);
    return () => this.registeredListeners.delete(listener);
  }

  public static execute(action: IGActionInvocation): ActionExecutionResult {
    try {
      // 1. Notify all subscribers (UI components)
      this.registeredListeners.forEach((fn) => fn(action));

      // 2. Dispatch custom window event for decoupled listeners in browser environment
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ocg:g-action", {
            detail: {
              type: action.actionId.toLowerCase(),
              actionId: action.actionId,
              payload: action.payload,
              uiNotice: action.uiToastMessage,
            },
          })
        );

        // 3. Handle primary navigation and interaction routing
        if (action.actionId === "NAVIGATE" && action.payload?.path) {
          window.location.href = action.payload.path;
        } else if (action.actionId === "INITIATE_SELLER_MODE") {
          if (!window.location.pathname.includes("/sell")) {
            const sellLink = document.querySelector('a[href="/sell"]') as HTMLAnchorElement;
            if (sellLink) sellLink.click();
            else window.location.href = "/sell";
          }
        } else if (action.actionId === "INITIATE_INVESTOR_QUALIFICATION") {
          if (!window.location.pathname.includes("/invest")) {
            const investLink = document.querySelector('a[href="/invest"]') as HTMLAnchorElement;
            if (investLink) investLink.click();
            else window.location.href = "/invest";
          }
        } else if (action.actionId === "INITIATE_BOOKING") {
          const contactLink = document.querySelector('a[href="/contact"]') as HTMLAnchorElement;
          if (contactLink) contactLink.click();
          else window.location.href = "/contact";
        } else if (action.actionId === "OPEN_STRATEGY_COMPARISON") {
          const strategySection = document.getElementById("strategies");
          if (strategySection) {
            strategySection.scrollIntoView({ behavior: "smooth" });
          }
        }
      }

      return {
        actionId: action.actionId,
        success: true,
        message: action.uiToastMessage || `Successfully executed ${action.actionId}`,
      };
    } catch (err: any) {
      console.error(`Failed to execute G Action [${action.actionId}]:`, err);
      return {
        actionId: action.actionId,
        success: false,
        message: err.message || `Execution error on ${action.actionId}`,
      };
    }
  }
}
