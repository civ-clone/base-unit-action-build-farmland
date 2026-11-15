"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildFarmland = exports.COMPLETE = void 0;
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Available_1 = require("@civ-clone/core-tile-improvement/Rules/Available");
const BuildingFarmland_1 = require("./Rules/BuildingFarmland");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Farmland_1 = require("@civ-clone/base-tile-improvement-farmland/Farmland");
const Irrigation_1 = require("@civ-clone/base-tile-improvement-irrigation/Irrigation");
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
     * What finishing does, on the tile the action was performed on, through the `Built` rules of the registry the action
     *  was constructed with: `Farmland` when the tile is still irrigated, keeping the `Irrigation`. When the irrigation has
     *  gone in the meantime (pillaged, say), the work irrigates the tile instead, as OpenCiv2's irrigation order does on
     *  a tile without irrigation (`unit_terrain_work_finish`, order 6), but only when the ruleset's `Available` rules
     *  allow `Irrigation` there for the unit's player; otherwise it does nothing.
     *
     * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
     */
    static complete(action, tileImprovementRegistry = TileImprovementRegistry_1.instance) {
        const tile = action.from(), irrigated = tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Irrigation_1.default);
        if (!irrigated) {
            if (action
                .ruleRegistry()
                .get(Available_1.default)
                .some((rule) => rule.validate(tile, Irrigation_1.default, action.unit().player()))) {
                new Irrigation_1.default(tile, action.ruleRegistry());
            }
            return;
        }
        new Farmland_1.default(tile, action.ruleRegistry());
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