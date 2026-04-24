// client/src/requests/ApiRequests.js
import ApiClient from "./ApiClient";

import { getAuthHeaders } from "./AuthRequests.js";

const SERVER_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : process.env.REACT_APP_API_URL + "/api";

const api = new ApiClient(SERVER_URL);

export const postImportMatches = async (event_code) => {
  return api.post(`/matches`, { event_code }, { headers: getAuthHeaders() });
};

export const getScoutMatch = async ({ eventKey, station, matchKey, scoutId }) => {
  return api.get(`/getScoutMatch`, {
    params: { eventKey, station, matchKey, scoutId },
    headers: getAuthHeaders(),
  });
};

export const submitMatch = async ({
  eventKey,
  matchNumber,
  teamNumber,
  scoutName,
  driverSkill,
  defenseSkill,
  comments,
}) => {
  console.log("submitMatch", eventKey, matchNumber, teamNumber, scoutName, driverSkill, defenseSkill, comments, getAuthHeaders());
  return api.post(
    `/reports/submit`,
    { eventKey, matchNumber, teamNumber, scoutName, driverSkill, defenseSkill, comments },
    { headers: getAuthHeaders() }
  );
};

export const getReports = async ({ eventKey, robot }) => {
  const params = new URLSearchParams();

  params.append("eventKey", eventKey);
  if (robot) params.append("robot", robot);

  return api.get(`/reports/?${params.toString()}`, {
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    },
  });
};
