import { beforeEach, describe, expect, it } from "vitest";
import { useDesignStore } from "./useDesignStore";

const s = () => useDesignStore.getState();

describe("undo / redo", () => {
  beforeEach(() => useDesignStore.setState({ elements: [], past: [], future: [], lastKey: null, selectedId: null }));

  it("undoes and redoes adding and editing", () => {
    s().addShape();
    const id = s().elements[0].id;
    s().update(id, { x: 10 });
    expect(s().elements[0].x).toBe(10);
    s().undo();
    expect(s().elements[0].x).toBe(0);
    s().undo();
    expect(s().elements.length).toBe(0);
    s().redo();
    s().redo();
    expect(s().elements[0].x).toBe(10);
  });

  it("merges one drag into a single undo step", () => {
    s().addShape();
    const id = s().elements[0].id;
    for (let i = 1; i <= 20; i++) s().update(id, { x: i }, "drag:1");
    expect(s().past.length).toBe(2);
    s().undo();
    expect(s().elements[0].x).toBe(0);
  });

  it("duplicates next to the original", () => {
    s().addShape();
    const id = s().elements[0].id;
    s().duplicate(id);
    expect(s().elements.length).toBe(2);
    expect(s().elements[1].x).toBe(5);
    expect(s().selectedId).toBe(s().elements[1].id);
  });
});
