import axios from 'axios';

export async function createOrUpdateGiteaUser(email, name) {
  const giteaApiUrl = `${process.env.GITEA_URL}/api/v1`;
  const giteaAdminAccessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN;
  const username = email.replace('@', '.')

  try {
    // Search for the user in Gitea
    const searchResponse = await axios.get(`${giteaApiUrl}/users/search`, {
      headers: { Authorization: `token ${giteaAdminAccessToken}` },
      params: { q: username },
    });

    // If the user exists, return the user and their token
    if (searchResponse.data.data.length > 0) {
      const giteaUser = searchResponse.data.data[0];
      return giteaUser;
    }
  } catch (error) {
    console.error('Error searching for Gitea user:', error);
  }
  const password = Math.random().toString(36).slice(-8)

  // If the user doesn't exist, create a new user in Gitea
  try {
    const newUser = {
      email,
      login_name: email,
      username,
      full_name: name,
      must_change_password: false,
      send_notify: false,
      source_id: 0,
      password,
    };

    const createResponse = await axios.post(`${giteaApiUrl}/admin/users`, newUser, {
      headers: { Authorization: `token ${giteaAdminAccessToken}` },
    });

    // Encode the username and password using Base64
    const token = Buffer.from(`${username}:${password}`).toString('base64');

    // Authenticate and then create & get access token
    const accessToken = await axios.post(`${giteaApiUrl}/users/${username}/tokens`, {name: 'studentcode-api'}, {
      headers: { Authorization: `Basic ${token}` },
    });

    const giteaUser = createResponse.data;
    giteaUser.accessToken = accessToken.data;
    return giteaUser;
  } catch (error) {
    console.error('Error creating Gitea user:', error);
  }
}