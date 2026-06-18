export function observeDomMutations(target: Node, onChange: () => void) {
  let timeoutId: number | undefined;

  const observer = new MutationObserver(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      onChange();
    }, 150);
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true
  });

  return () => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }

    observer.disconnect();
  };
}
