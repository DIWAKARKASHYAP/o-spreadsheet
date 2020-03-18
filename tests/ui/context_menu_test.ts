import { GridModel } from "../../src/model";
import {
  GridParent,
  makeTestFixture,
  triggerMouseEvent,
  nextTick,
  simulateClick
} from "../helpers";
import { Registry } from "../../src/registry";
import { ContextMenuItem } from "../../src/ui/registries";

let fixture: HTMLElement;

beforeEach(() => {
  fixture = makeTestFixture();
});

afterEach(() => {
  fixture.remove();
});

function simulateContextMenu(x, y) {
  const target = document.querySelector("canvas")! as HTMLElement;
  triggerMouseEvent("canvas", "mousedown", x, y, { button: 1 });
  target.focus();
  triggerMouseEvent("canvas", "mouseup", x, y, { button: 1 });
  triggerMouseEvent("canvas", "contextmenu", x, y, { button: 1 });
}

describe("Context Menu", () => {
  test("right click on a cell opens a context menu", async () => {
    const model = new GridModel();

    const parent = new GridParent(model);
    await parent.mount(fixture);
    // todo: find a way to have actual width/height instead of this
    model.state.viewport = { left: 0, top: 0, right: 9, bottom: 9 };

    expect(model.state.activeXc).toBe("A1");
    expect(fixture.querySelector(".o-context-menu")).toBeFalsy();
    simulateContextMenu(300, 200);
    expect(model.state.activeXc).toBe("C8");
    await nextTick();
    expect(fixture.querySelector(".o-context-menu")).toBeTruthy();
  });

  test("right click on a cell, then left click elsewhere closes a context menu", async () => {
    const model = new GridModel();

    const parent = new GridParent(model);
    await parent.mount(fixture);
    // todo: find a way to have actual width/height instead of this
    model.state.viewport = { left: 0, top: 0, right: 9, bottom: 9 };

    simulateContextMenu(300, 200);
    expect(model.state.activeXc).toBe("C8");
    await nextTick();
    expect(fixture.querySelector(".o-context-menu")).toBeTruthy();

    simulateClick("canvas", 50, 50);
    await nextTick();
    expect(fixture.querySelector(".o-context-menu")).toBeFalsy();
  });

  test("can copy/paste with context menu", async () => {
    const model = new GridModel();
    model.setValue("B1", "b1");

    const parent = new GridParent(model);
    await parent.mount(fixture);
    // todo: find a way to have actual width/height instead of this
    model.state.viewport = { left: 0, top: 0, right: 9, bottom: 9 };

    // right click on B1
    simulateContextMenu(230, 30);
    expect(model.state.activeXc).toBe("B1");
    await nextTick();

    // click on 'copy' menu item
    simulateClick(".o-context-menu div[data-name='copy']");
    await nextTick();

    // right click on B2
    simulateContextMenu(230, 50);
    await nextTick();
    expect(model.state.activeXc).toBe("B2");

    // click on 'paste' menu item
    simulateClick(".o-context-menu div[data-name='paste']");
    await nextTick();

    expect(model.workbook.cells.B1.content).toBe("b1");
    expect(model.workbook.cells.B2.content).toBe("b1");
  });

  test("can cut/paste with context menu", async () => {
    const model = new GridModel();
    model.setValue("B1", "b1");

    const parent = new GridParent(model);
    await parent.mount(fixture);
    // todo: find a way to have actual width/height instead of this
    model.state.viewport = { left: 0, top: 0, right: 9, bottom: 9 };

    // right click on B1
    simulateContextMenu(230, 30);
    expect(model.state.activeXc).toBe("B1");
    await nextTick();

    // click on 'cut' menu item
    simulateClick(".o-context-menu div[data-name='cut']");
    await nextTick();

    // right click on B2
    simulateContextMenu(230, 50);
    await nextTick();
    expect(model.state.activeXc).toBe("B2");

    // click on 'paste' menu item
    simulateClick(".o-context-menu div[data-name='paste']");
    await nextTick();

    expect(model.workbook.cells.B1).not.toBeDefined();
    expect(model.workbook.cells.B2.content).toBe("b1");
  });

  test("Visible - Enable", () => {
    const registry = new Registry<ContextMenuItem>();
    registry.add("enabled", {
      type: "action",
      name: "1",
      description: "1",
      action: () => true
    });
    registry.add("disabled", {
      type: "action",
      name: "1",
      description: "1",
      action: () => true,
      isEnabled: () => false
    });
    registry.add("visible", {
      type: "action",
      name: "1",
      description: "1",
      action: () => true
    });
    registry.add("invisible", {
      type: "action",
      name: "1",
      description: "1",
      action: () => true,
      isVisible: () => false
    });
    const items = registry.getAll().filter(item => !item.isVisible || item.isVisible("CELL"));
    expect(items.length).toBe(3);
    const enabled = items.filter(item => !item.isEnabled || item.isEnabled(null));
    expect(enabled.length).toBe(2);
  });
});
