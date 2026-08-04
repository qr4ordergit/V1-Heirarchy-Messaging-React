const COGNITO_DOMAIN =
  "https://ap-south-1g1uv9nbct.auth.ap-south-1.amazoncognito.com";

const CLIENT_ID = "65tl29mkauin3t0ic18cu0oifi";

const REDIRECT_URI =
  "https://u2hjtodeyl.execute-api.ap-south-1.amazonaws.com/dev/api/callback";

const FRONTEND_CALLBACK_URL = `${window.location.origin}`;

export const COGNITO_LOGIN_URL =
  `${COGNITO_DOMAIN}/login/continue?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=email+openid+phone+aws.cognito.signin.user.admin` +
  `&state=${encodeURIComponent(FRONTEND_CALLBACK_URL)}`;
