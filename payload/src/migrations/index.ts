import * as migration_20260802_124327_initial from './20260802_124327_initial';

export const migrations = [
  {
    up: migration_20260802_124327_initial.up,
    down: migration_20260802_124327_initial.down,
    name: '20260802_124327_initial'
  },
];
