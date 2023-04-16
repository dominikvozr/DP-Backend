/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";
// const git = require('simple-git');

export default class Jenkins {

  public static startEvaluate = async (repo: string, token: string) => {
    try {
      const response = await axios.post(
        `${process.env.JENKINS_URL}/job/StudentSeedJob/buildWithParameters?REPO_NAME=${repo}&ACCESS_TOKEN=${token}&REPO_URL=${process.env.GITEA_URL}/${repo}.git`,
        {},
        {
          auth: {
            username: process.env.JENKINS_SC_NAME,
            password: process.env.JENKINS_SC_TOKEN,
          },
        }
      );
      return response
    } catch (err) {
      return err.response
    }
  }
}