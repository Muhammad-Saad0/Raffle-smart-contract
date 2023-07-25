const { run } = require('hardhat');

async function verify(contractAddress, args) {
	//this "run" allows us to run any hardhat task
	//(that can be run in terminal)

	//verify:verify means seccond verify if the subtask of verift command
	try {
		await run('verify:verify', {
			address: contractAddress,
			constructorArguments: args,
		});
		console.log(
			'verification completed!!!!!'
		);
	} catch (error) {
		console.log(error.message);
	}
}

module.exports = { verify };
