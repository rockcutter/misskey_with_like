'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a reposts of a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'post_id' parameter
	const [postId, postIdErr] = it(params.post_id, 'id', true);
	if (postIdErr) return rej('invalid post_id param');

	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = it(params.since_id).expect.id().qed();
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = it(params.max_id).expect.id().qed();
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	// Lookup post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		repost_id: post._id
	} as any;
	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (maxId) {
		query._id = {
			$lt: maxId
		};
	}

	// Issue query
	const reposts = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(reposts.map(async post =>
		await serialize(post, user))));
});
