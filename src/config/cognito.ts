const COGNITO_DOMAIN = "https://auth.ukrchat.com";

const CLIENT_ID = "23cit9rjklaebv2st7mip0b1h9";

export const REDIRECT_URI =
  "https://53mxdgl1ok.execute-api.eu-central-1.amazonaws.com/dev/api/callback";

const FRONTEND_CALLBACK_URL = `${window.location.origin}`;

export const LOGOUT_REDIRECT_URI = `${window.location.origin}/#/`;

export const COGNITO_LOGIN_URL =
  `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&prompt=login` +
  `&scope=aws.cognito.signin.user.admin+email+openid+phone` +
  `&state=${encodeURIComponent(FRONTEND_CALLBACK_URL)}`;
