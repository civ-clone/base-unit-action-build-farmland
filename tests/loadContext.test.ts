import { COMPLETE } from '../BuildFarmland';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';
import Farmland from '@civ-clone/base-tile-improvement-farmland/Farmland';
import Generator from '@civ-clone/core-world-generator/Generator';
import Irrigation from '@civ-clone/base-tile-improvement-irrigation/Irrigation';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';

// civ-clone/web-renderer#248
describe('BuildFarmland, loaded into a game with its own registries', (): void => {
  it("builds `Farmland` when the context's `tileImprovements` holds the irrigation", (): void => {
    const context = {
        pendingEffects: new PendingEffectRegistry(),
        rules: new RuleRegistry(),
        tileImprovements: new TileImprovementRegistry(),
        turn: new Turn(),
      },
      tile = new Tile(0, 0, new Terrain(), new World(new Generator(1, 1))),
      unit = new Unit(null, new Player(), tile, context.rules),
      built: TileImprovement[] = [];

    context.rules.register(
      new Built(
        new Effect((builtTile: Tile, improvement: TileImprovement): void => {
          built.push(improvement);
        })
      )
    );
    // Registered directly, so `Built` records only what completing builds.
    context.tileImprovements.register(new Irrigation(tile, new RuleRegistry()));
    context.pendingEffects.register(
      new PendingEffect(COMPLETE, unit, { endTurn: '1' })
    );
    context.turn.set(1);

    busyRegistryInstance.rebuild('BuildingFarmland', unit, context).process();

    expect(built).to.have.length(1);
    expect(built[0]).to.instanceof(Farmland);
  });
});
