import DelayedAction from '@civ-clone/core-unit/DelayedAction';
export declare const COMPLETE = 'base-unit-action-build-farmland:complete';
/**
 * Builds `Farmland` on the unit's own tile, which is meant to be irrigated already: the `Irrigation` stays, and the
 *  `Farmland` is built beside it. The work takes as many turns as the largest `MovementCost` answer for this action,
 *  divided by the unit's `WorkRate` (see `DelayedAction`).
 *
 * Which units may build it, and where, is the ruleset's: base-unit-action-rules' `terrainJob(deps, Farmland,
 *  requiresImprovement(deps, Irrigation))` gives the usual criteria (a unit that `Terraforms`, moves left, an
 *  `Available` rule allowing `Farmland` there, the unit's own tile, already irrigated).
 */
export declare class BuildFarmland extends DelayedAction {
  perform(): void;
  /**
   * What finishing does: `Farmland` on the tile the action was performed on, built through the `Built` rules of the
   *  registry the action was constructed with. Nothing on the tile is removed.
   *
   * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
   */
  static complete(action: BuildFarmland): void;
}
export default BuildFarmland;
