angular.module('jumplink.cms.attachment', [
  'sails.io',
])

.service('AttachmentService', function (moment, $sailsSocket, $async, $log) {

  /**
   * delete attachment on local / client / browser
   */
  var destroyLocally = function (blogPosts, postIndex, attachmentIndex, cb) {
    if(blogPosts[postIndex].attachments.length > 0) blogPosts[postIndex].attachments.splice(attachmentIndex, 1);
    return cb(null, blogPosts, postIndex, attachmentIndex);
  };

  /**
   * delete attachment extern / server
   */
  var destroyExternally = function (blogPosts, postIndex, attachmentIndex, cb) {
    $sailsSocket.post('/blog/destroy/', {blogPostID: blogPosts[postIndex].id, attachmentUploadedAs: blogPosts[postIndex].attachments[attachmentIndex].uploadedAs})
    .success(function (data, status, headers, config) {
      $log.debug(null, data, status, headers, config);
      cb();
    })
    .error(function (data, status, headers, config) {
      $log.error(data, status, headers, config);
      cb("error", data, status, headers, config);
    });
  };

  var destroy = function (blogPosts, post, attachmentIndex, cb) {
    var postIndex = blogPosts.indexOf(post);
    $log.debug("[BlogService.destroy]", blogPosts[postIndex], attachmentIndex);
    return destroyExternally(blogPosts, postIndex, attachmentIndex, function (err, data, status, headers, config) {
      if(err) $log.error("[BlogService.destroy.destroyExternally]", err, data, status, headers, config);
      return destroyLocally(blogPosts, postIndex, attachmentIndex, cb);
    });
  };

  return {
    destroyLocally: destroyLocally,
    destroyExternally: destroyExternally,
    destroy: destroy,
  };
});