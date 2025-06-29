import axios from 'axios';
import { POPULAR_LEAGUES, POPULAR_TEAMS, NATIONALITIES } from './defaultData';

const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export async function getLeagues() {
  return POPULAR_LEAGUES;
}

export async function getNationalities() {
  return NATIONALITIES;
}

export async function getTeams(league) {
  return POPULAR_TEAMS[league] || [];
}

export async function searchPlayers(query) {
  const resp = await axios.get(`${API_BASE}/searchplayers.php`, { params: { p: query } });
  const players = resp.data.player || [];
  return players.map(p => p.strPlayer).filter(Boolean);
}

export async function getPlayerDetails(name) {
  const resp = await axios.get(`${API_BASE}/searchplayers.php`, { params: { p: name } });
  const list = resp.data.player || [];
  if (!list.length) {
    throw new Error('Player not found');
  }
  const lowered = name.toLowerCase();
  let player = list.find(p => (p.strPlayer || '').toLowerCase() === lowered) || list[0];
  let league = null;
  if (player.strTeam) {
    try {
      const teamResp = await axios.get(`${API_BASE}/searchteams.php`, { params: { t: player.strTeam } });
      const teamList = teamResp.data.teams || [];
      if (teamList.length) {
        league = teamList[0].strLeague;
      }
    } catch (e) {
      // ignore network errors
    }
  }
  return {
    name: player.strPlayer,
    nationality: player.strNationality,
    club: player.strTeam,
    league,
    photo: player.strCutout || player.strThumb || player.strRender,
  };
}
