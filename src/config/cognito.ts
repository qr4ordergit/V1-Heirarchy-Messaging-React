// const COGNITO_DOMAIN =
//   "https://ap-south-1g1uv9nbct.auth.ap-south-1.amazoncognito.com";
// const CLIENT_ID = "65tl29mkauin3t0ic18cu0oifi";

// const REDIRECT_URI = "https://example.com";

// export const COGNITO_LOGIN_URL =
//   `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
//   `&response_type=code&scope=email+openid+phone` +
//   `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
// const COGNITO_DOMAIN =
//   "https://ap-south-1g1uv9nbct.auth.ap-south-1.amazoncognito.com";
// const CLIENT_ID = "65tl29mkauin3t0ic18cu0oifi";
// const REDIRECT_URI = "http://localhost:5173/dashboard";

// export const COGNITO_LOGIN_URL =
//   `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
//   `&response_type=code&scope=email+openid+phone` +
//   `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

const COGNITO_DOMAIN =
  "https://ap-south-1g1uv9nbct.auth.ap-south-1.amazoncognito.com";

const CLIENT_ID = "65tl29mkauin3t0ic18cu0oifi";

// Must exactly match the Callback URL configured in Cognito.
const REDIRECT_URI =
  "https://io85vyk8x6.execute-api.ap-south-1.amazonaws.com/dev/api/callback";

export const COGNITO_LOGIN_URL =
  `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
  `&response_type=code&scope=email+openid+phone` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

//https://ap-south-1g1uv9nbct.auth.ap-south-1.amazoncognito.com/login?client_id=65tl29mkauin3t0ic18cu0oifi&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Fio85vyk8x6.execute-api.ap-south-1.amazonaws.com%2Fdev%2Fapi%2Fcallback
