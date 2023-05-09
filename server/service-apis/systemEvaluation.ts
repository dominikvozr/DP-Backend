/* eslint-disable @typescript-eslint/no-var-requires */
import Event from "./../models/Event";
const fs = require('fs-extra');
const path = require('path');
const git = require('simple-git');
import Gitea from './gitea';
import Jenkins from "./jenkins";
const glob = require('glob');

export default class SystemEvaluation {
	public static invokeEvaluation = async (test: any) : Promise<{ status: number; message: string; }> => {
		const randomName = Math.random().toString(36).substring(2, 15);
		const tempDir = path.join(__dirname, randomName);
		const accessToken = test.user.gitea.accessToken.sha1
		const profAccessToken = test.exam.user.gitea.accessToken.sha1
		const adminAccessToken = process.env.GITEA_ADMIN_ACCESS_TOKEN
		const repoName = `${test.user.gitea.username}/${test.slug}-student`

		try {
			// Clone project repository
			await git().clone(`http://${accessToken}@bawix.xyz:81/gitea/${repoName}.git`, tempDir);
			// setup git
			const projectRepo = git(tempDir, { config: ['user.email=studentcode@studentcode.sk', 'user.name=studentcode'] });
			// Get all files that starts with tests* to project repository
			const testsRepoName = `${test.exam.user.gitea.username}/${test.exam.slug}-test`
			await Gitea.prepareTests(testsRepoName, profAccessToken, tempDir)
			// Get Jenkinsfile from the pipelines repository
			const pipelineRepoName = `${test.exam.pipeline.slug}-pipeline`
			await Gitea.preparePipeline(pipelineRepoName, repoName, adminAccessToken, tempDir, test._id)

			// Select all files in the directory except those starting with '.!'
			const files: string[] = await new Promise((resolve, reject) => {
				glob(path.join(tempDir, '*'), { ignore: '.!**' }, (err, matches) => {
					if (err) {
						reject(err);
					} else {
						resolve(matches);
					}
				});
			});

			// add, commit, and push changes to Gitea
			await projectRepo.add('-f', files);
			await projectRepo.commit('Add tests and Jenkinsfile');
			await projectRepo.push('origin', 'master', ['--force']);
			// start evaluation process on pushed test
			await Jenkins.startEvaluate(repoName, accessToken)
			Event.createEvent({
				userId: test.user._id,
				name: `Test evaluation started`,
				description: `${test.user.displayName}, your test evaluation has started.`,
				type: 'evaluationStarted',
			});
			console.log(`Successfully triggered Seed Job for ${repoName}`);
			// Clean up temporary directories
			fs.rmSync(tempDir, { recursive: true });
			return { status: 200, message: 'Repository prepared successfully' };
		} catch (err) {
			console.error(err);
			return { status: 500, message: 'Error when preparing repository' };
		}
	}
}