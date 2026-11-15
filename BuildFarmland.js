"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildFarmland = exports.COMPLETE = void 0;
const BuildingFarmland_1 = require("./Rules/BuildingFarmland");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Farmland_1 = require("@civ-clone/base-tile-improvement-farmland/Farmland");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
exports.COMPLETE = 'base-unit-action-build-farmland:complete';
/**
 * Builds `Farmland` on the unit's own tile, which is meant to be irrigated already: the `Irrigation` stays, and the
 *  `Farmland` is built beside it. The work takes as many turns as the largest `MovementCost` answer for this action,
 *  divided by the unit's `WorkRate` (see `DelayedAction`).
 *
 * Which units may build it, and where, is the ruleset's: base-unit-action-rules' `terrainJob(deps, Farmland,
 *  requiresImprovement(deps, Irrigation))` gives the usual criteria (a unit that `Terraforms`, moves left, an
 *  `Available` rule allowing `Farmland` there, the unit's own tile, already irrigated).
 */
class BuildFarmland extends DelayedAction_1.default {
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost || 0, exports.COMPLETE, BuildingFarmland_1.default);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
    /**
     * What finishing does: `Farmland` on the tile the action was performed on, built through the `Built` rules of the
     *  registry the action was constructed with. Nothing on the tile is removed.
     *
     * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
     */
    static complete(action) {
        new Farmland_1.default(action.from(), action.ruleRegistry());
    }
}
exports.BuildFarmland = BuildFarmland;
// Registered here, as every delayed action is, so a unit part-way through this can be saved: the save records the
//  identifier and the behaviour stays in this package.
(0, registerDelayedAction_1.default)({
    BusyRule: BuildingFarmland_1.default,
    handler: exports.COMPLETE,
    action: (unit) => new BuildFarmland(unit.tile(), unit.tile(), unit),
    complete: (unit, pendingEffect, action) => BuildFarmland.complete(action),
});
exports.default = BuildFarmland;
//# sourceMappingURL=BuildFarmland.js.map