import { Model } from "../../src";
import {
  addDataValidation,
  createFilter,
  setCellContent,
  setStyle,
} from "../test_helpers/commands_helpers";
import { getStyle } from "../test_helpers/getters_helpers";
import { mountSpreadsheet, nextTick } from "../test_helpers/helpers";
import { MockGridRenderingContext } from "../test_helpers/renderer_helpers";

describe("Checkbox in model", () => {
  let model: Model;

  beforeEach(async () => {
    model = new Model();
  });

  test("Adding a checkbox rule will make its cells align middle/center", () => {
    addDataValidation(model, "A1:A2", "id", { type: "isBoolean", values: [] });
    expect(getStyle(model, "A1")).toMatchObject({ align: "center", verticalAlign: "middle" });
    expect(getStyle(model, "A2")).toMatchObject({ align: "center", verticalAlign: "middle" });
  });

  test("Adding a checkbox rule no not overwrite the style of the cell", () => {
    setStyle(model, "A1", { align: "left", verticalAlign: "top" });
    setStyle(model, "A2", { fillColor: "#FF0000" });
    addDataValidation(model, "A1:A2", "id", { type: "isBoolean", values: [] });
    expect(getStyle(model, "A1")).toMatchObject({ align: "left", verticalAlign: "top" });
    expect(getStyle(model, "A2")).toMatchObject({
      fillColor: "#FF0000",
      align: "center",
      verticalAlign: "middle",
    });
  });

  describe("renderer", () => {
    let renderedTexts: string[];
    let ctx: MockGridRenderingContext;

    beforeEach(() => {
      renderedTexts = [];
      ctx = new MockGridRenderingContext(model, 1000, 1000, {
        onFunctionCall: (fn, args) => {
          if (fn === "fillText") {
            renderedTexts.push(args[0]);
          }
        },
      });
    });

    test("Valid checkbox value is not rendered", () => {
      addDataValidation(model, "B2", "id", { type: "isBoolean", values: [] });
      setCellContent(model, "B2", "TRUE");
      model.drawGrid(ctx);
      expect(renderedTexts).not.toContain("TRUE");
    });

    test("Invalid checkbox value is rendered", () => {
      addDataValidation(model, "B2", "id", { type: "isBoolean", values: [] });
      setCellContent(model, "B2", "hello");
      model.drawGrid(ctx);
      expect(renderedTexts).toContain("hello");
    });
  });
});

describe("Checkbox component", () => {
  test("Data validation checkbox on formula is disabled", async () => {
    const model = new Model();
    addDataValidation(model, "A1", "id", { type: "isBoolean", values: [] });
    const { fixture } = await mountSpreadsheet({ model });
    await nextTick();

    expect(fixture.querySelector(".o-dv-checkbox")?.classList).not.toContain("pe-none");
    setCellContent(model, "A1", "=TRUE");
    await nextTick();
    expect(fixture.querySelector(".o-dv-checkbox")?.classList).toContain("pe-none");
  });

  test("Data validation checkbox is disabled in readonly mode", async () => {
    const model = new Model();
    addDataValidation(model, "A1", "id", { type: "isBoolean", values: [] });
    model.updateMode("readonly");
    const { fixture } = await mountSpreadsheet({ model });

    expect(fixture.querySelector(".o-dv-checkbox")?.classList).toContain("pe-none");
  });

  test("Icon is not displayed if there is a filter icon", async () => {
    const model = new Model();
    addDataValidation(model, "A1", "id", { type: "isBoolean", values: [] });
    createFilter(model, "A1:A4");

    const { fixture } = await mountSpreadsheet({ model });
    expect(fixture.querySelector(".o-dv-checkbox")).toBeNull();
    expect(fixture.querySelector(".o-filter-icon")).not.toBeNull();
  });
});
