export function calculateChemistry(players) {
  const clubs = {};
  const leagues = {};
  const nations = {};

  players.flat().forEach(p => {
    if (!p) return;
    if (p.club) clubs[p.club] = (clubs[p.club] || 0) + 1;
    if (p.league) leagues[p.league] = (leagues[p.league] || 0) + 1;
    if (p.nationality) nations[p.nationality] = (nations[p.nationality] || 0) + 1;
  });

  // New chemistry rules
  const clubContribution = count => {
    if (count >= 7) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
  };

  const leagueContribution = count => {
    if (count >= 8) return 3;
    if (count >= 5) return 2;
    if (count >= 3) return 1;
    return 0;
  };

  const nationContribution = count => {
    if (count >= 8) return 3;
    if (count >= 5) return 2;
    if (count >= 2) return 1;
    return 0;
  };

  return players.map(row =>
    row.map(p => {
      if (!p) return 0;
      const chem =
        clubContribution(clubs[p.club] || 0) +
        leagueContribution(leagues[p.league] || 0) +
        nationContribution(nations[p.nationality] || 0);
      return Math.min(3, chem);
    })
  );
}
