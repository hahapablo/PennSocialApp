/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red, pink } from '@mui/material/colors';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ReplyIcon from '@material-ui/icons/Reply';
import FlagIcon from '@mui/icons-material/Flag';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import {
  deletePost, addComment, postMessage, flagPostForDeletion, deleteComment, editComment, getCommentByID, getUserByID, getAllUsers,
} from "../fetch";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

function PostMedia(props) {
  const { msg } = props;
  if (msg.indexOf('(link-image)http') === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        <img src={msg.split('(link-image)')[1]} style={{ maxWidth: "100%", maxHeight: "200px", }} />
      </Typography>
    );
  }
  if (msg.indexOf('(link-video)http') === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        <video controls style={{ width: "100%" }}>
          <source
            src={msg.split('(link-video)')[1]}
            type="video/mp4"
          />
          Sorry, your browser does not support embedded videos.
        </video>
      </Typography>

    );
  }
  if (msg.indexOf('(link-audio)http') === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        <audio
          controls
          style={{ width: "100%" }}
          src={msg.split('(link-audio)')[1]}
        >
          Your browser does not support the audio element.
        </audio>
      </Typography>

    );
  }
  return (
    <Typography variant="body2" color="text.secondary">
      {msg}
    </Typography>
  );
}

export default function PostCard(props) {
  const {
    hide,
    updateHide,
    post,
    allPosts,
    updateAllPosts,
    allUsers
  } = props;

  const userID = sessionStorage.getItem('id');
  const postID = post._id;
  const groupID = post.group_id;
  const authorID = post.author_id;

  const [currUser, setCurrUser] = React.useState(null);
  const [error, setError] = React.useState('');
  const [openError, setOpenError] = React.useState(false);
  const [allComments, setAllComments] = React.useState([]);
  const [showNormalFlag, setShowNormalFlag] = React.useState(true);
  const [postAuthor, setPostAuthor] = React.useState('');
  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  const [username, setUsername] = React.useState('');
  const [refresh, setRefresh] = React.useState(false);
  const [postAvatar, setPostAvatar] = React.useState('');
  
  React.useEffect(async () => {
    const commentIDs = post.comment_ids;
    const commentsToShow = [];
    // const userObj = await getUserByID(userID);
    const userObj = allUsers.find((u) => u._id === authorID);
    setCurrUser(userObj);
    for (const eachID of commentIDs) {
      const comment = await getCommentByID(eachID);
      // console.log("comment object = ", comment);
      // const commentAuthorObj = await getUserByID(comment.author_id);
      const authorUsername = (allUsers.find((u) => u._id === comment.author_id) && allUsers.find((u) => u._id === comment.author_id).username) || "invalid";
      const authorAvatar = (allUsers.find((u) => u._id === comment.author_id) && allUsers.find((u) => u._id === comment.author_id).avatar_url) || "";
      const newComment = { ...comment, author_username: authorUsername, author_avatar: authorAvatar };
      commentsToShow.push(newComment);
    }

    setAllComments(commentsToShow);
    if (userObj) {
      setUsername(userObj.username);
    }
    if (post.flag_for_deletion) {
      setShowNormalFlag(false);
    }
    setPostAuthor((allUsers.find((u) => u._id === authorID) && allUsers.find((u) => u._id === authorID).username) || 'invalid');
    setPostAvatar((allUsers.find((u) => u._id === authorID) && allUsers.find((u) => u._id === authorID).avatar_url) || '');
    // const users = await getAllUsers();
    // if (users.length) {
    //   for (let i = 0; i < users.length; i += 1) {
    //     console.log(users[i]._id);
    //   }
    //   setPostAuthor(users.find((u) => u._id === authorID) && users.find((u) => u._id === authorID).username);
    // }
  }, [refresh, props.refresh]);

  // comment toggle down
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // delete a post
  const [openDeletePost, setOpenDeletePost] = React.useState(false);

  const handleClickOpenDeletePost = () => {
    // the user has to be either the author or the admin to delete the post
    if (currUser._id === authorID || currUser.group_admins.includes(groupID)) {
      setOpenDeletePost(true);
    } else {
      setError('You have to be the author or the group administrator to delete this post.');
      setOpenError(true);
    }
  };

  const handleCloseDeletePost = () => {
    setOpenDeletePost(false);
  };

  const handleConfirmDeletePost = async () => {
    const res = await deletePost(userID, postID, groupID);
    let tempPosts = [];
    if (res.ok) {
      tempPosts = allPosts.filter((p) => String(p._id) !== postID);
    }
    // update the state in Post.js so that it can rerender and 
    // reflect the change of deleting the post
    updateAllPosts(tempPosts);
    setOpenDeletePost(false);
    postMessage(sessionStorage.getItem('username'), sessionStorage.getItem('username'), 'update');
  };

  const handleCloseError = () => {
    setOpenError(false);
  };

  // hide a post
  const [openHidePost, setOpenHidePost] = React.useState(false);

  const handleClickOpenHidePost = () => {
    setOpenHidePost(true);
  };

  const handleCloseHidePost = () => {
    setOpenHidePost(false);
  };

  const handleConfirmHidePost = () => {
    hide.push(postID);
    // console.log(props.post._id);
    updateHide(hide);
    setOpenHidePost(false);
  };

  // flag a post for deletion
  const [openFlagPost, setOpenFlagPost] = React.useState(false);

  const handleClickOpenFlagPost = () => {
    setOpenFlagPost(true);
  };

  const handleCloseFlagPost = () => {
    setOpenFlagPost(false);
  };

  const handleConfirmFlagPost = async () => {
    const res = await flagPostForDeletion(userID, postID);
    const print = await res.json();
    setOpenFlagPost(false);
    setShowNormalFlag(false);
    postMessage(sessionStorage.getItem('username'), sessionStorage.getItem('username'), 'update');
  };

  // post analytics
  const [openAnalytics, setOpenAnalytics] = React.useState(false);

  const handleClickOpenAnalytics = () => {
    setOpenAnalytics(true);
  };

  const handleCloseAnalytics = () => {
    setOpenAnalytics(false);
  };

  // delete a comment
  const [openDeleteComment, setOpenDeleteComment] = React.useState(false);

  const handleClickOpenDeleteComment = (currComment) => {
    if (currComment.author_id === userID || currUser.group_admins.includes(groupID)) {
      setOpenDeleteComment(true);
    } else {
      setError('You are not authorized to delete this comment!');
      setOpenError(true);
    }
  };

  const handleCloseDeleteComment = () => {
    setOpenDeleteComment(false);
  };

  const handleConfirmDeleteComment = async (commentID) => {
    const res = await deleteComment(userID, commentID);
    let tempComments = [];
    if (res.ok) {
      tempComments = allComments.filter((p) => String(p._id) !== commentID);
    }
    setAllComments(tempComments);
    setOpenDeleteComment(false);
  };

  // edit a comment
  const [openEditComment, setOpenEditComment] = React.useState(false);
  const [editedComment, setEditedComment] = React.useState(false);

  const handleClickOpenEditComment = () => {
    setOpenEditComment(true);
  };

  const handleCloseEditComment = () => {
    setOpenEditComment(false);
  };

  const handleChangeEditedComment = (event) => {
    setEditedComment(event.target.value);
  };

  const handleConfirmEditComment = async (commentID) => {
    // console.log(editedComment);
    const res = await editComment(editedComment, commentID, userID);
    const print = await res.json();

    setOpenEditComment(false);
  };

  // send a comment to a post
  const [newComment, setNewComment] = React.useState('');

  const handleChangeNewComment = (event) => {
    setNewComment(event.target.value);
  };

  const handleSendNewComment = async () => {
    const res = await addComment(newComment, userID, postID);
    const print = await res.json();
    await delay(2000);
    postMessage(sessionStorage.getItem('username'), sessionStorage.getItem('username'), 'update');
    await delay(2000);
    postMessage(sessionStorage.getItem('username'), sessionStorage.getItem('username'), 'update');
    // console.log(print);
  };

  return (
    <Card sx={{
      marginY: 2, width: '100%',
    }}
    >
      <CardHeader
        avatar={
          // <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
          //   {username.charAt(0)}
          // </Avatar>
          <Avatar alt={username} src={postAvatar} />
        }
        action={
          <div>
            {/* delete a post */}
            <IconButton aria-label="settings" onClick={handleClickOpenDeletePost}>
              <DeleteIcon />
            </IconButton>

            <Dialog
              open={openError}
              onClose={handleCloseError}
            // aria-labelledby="alert-dialog-title"
            // aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                Not Authorized!
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {error}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseError}>Close</Button>
              </DialogActions>
            </Dialog>
            <Dialog
              open={openDeletePost}
              onClose={handleCloseDeletePost}
            >
              <DialogTitle id="alert-dialog-title">
                Do you want to delete this post?
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  You have to be the author or the group administrator to delete this post.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDeletePost}>Cancel</Button>
                <Button onClick={handleConfirmDeletePost} autoFocus>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

            {/* hide a post */}
            <IconButton aria-label="settings" onClick={handleClickOpenHidePost}>
              <VisibilityOffIcon />
            </IconButton>

            <Dialog
              open={openHidePost}
              onClose={handleClickOpenHidePost}
            >
              <DialogTitle id="alert-dialog-title">
                Do you want to hide this post?
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  You will no longer see this post and its comment in this group.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseHidePost}>Cancel</Button>
                <Button onClick={handleConfirmHidePost} autoFocus>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

            {/* flag as inappropriate */}
            <IconButton aria-label="settings" onClick={handleClickOpenFlagPost}>
              {showNormalFlag ? <FlagIcon /> : <FlagIcon sx={{ color: pink[500] }} />}
            </IconButton>

            <Dialog
              open={openFlagPost}
              onClose={handleClickOpenFlagPost}
            >
              <DialogTitle id="alert-dialog-title">
                Do you want to flag this post as inappropriate?
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  You flag will be reported to the group administrator.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseFlagPost}>Cancel</Button>
                <Button onClick={handleConfirmFlagPost} autoFocus>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

            {/* post analytics */}
            <IconButton aria-label="settings" onClick={handleClickOpenAnalytics}>
              <EqualizerIcon />
            </IconButton>

            <Dialog
              open={openAnalytics}
              onClose={handleClickOpenAnalytics}
            >
              <DialogTitle id="alert-dialog-title">
                Post Analytics
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  The number of replies for this post: {post.comment_ids.length}
                </DialogContentText>
                <DialogContentText id="alert-dialog-description">
                  The post was created: {post.created_at}
                </DialogContentText>
                <DialogContentText id="alert-dialog-description">
                  Possibility of inappropriate content: {post.flag_for_deletion ? "True" : "False"}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseAnalytics}>Close</Button>
              </DialogActions>
            </Dialog>

          </div>
        }
        title={postAuthor}
        subheader={props.post.created_at}
      />
      <CardContent>
        <Typography variant="body1" color="text.primary">
          Title: {props.post && props.post.title}
        </Typography>
        <PostMedia msg={props.post && props.post.content} />
      </CardContent>
      <CardActions disableSpacing>

        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>

      {/* Below is comment section */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>

        {/* TODO: add real comments */}
        {allComments.map((comment) => (
          <div key={comment._id} className="comments">
            <CardHeader
              avatar={
                <Avatar alt={comment.author_username} src={comment.author_avatar} />
              }
              action={
                <div>
                  {/* Delete a comment */}
                  <IconButton aria-label="settings" onClick={() => { handleClickOpenDeleteComment(comment); }}>
                    <DeleteIcon />
                  </IconButton>

                  <Dialog
                    open={openDeleteComment}
                    onClose={handleCloseDeleteComment}
                  >
                    <DialogTitle id="alert-dialog-title">
                      Do you want to delete this reply?
                    </DialogTitle>
                    <DialogContent>
                      <DialogContentText id="alert-dialog-description">
                        You have to be the author or the group administrator to delete this post.
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCloseDeleteComment}>Cancel</Button>
                      <Button onClick={() => { handleConfirmDeleteComment(comment._id); }} autoFocus>
                        Confirm
                      </Button>
                    </DialogActions>
                  </Dialog>

                  {/* Edit a comment */}
                  <IconButton aria-label="settings" onClick={handleClickOpenEditComment}>
                    <EditIcon />
                  </IconButton>
                  <Dialog
                    open={openEditComment}
                    onClose={handleCloseEditComment}
                  >
                    <DialogTitle id="alert-dialog-title">
                      Please enter your new comment.
                    </DialogTitle>
                    <TextField
                      id="outlined-multiline-static"
                      label="Reply"
                      multiline
                      fullWidth
                      rows={4}
                      onChange={handleChangeEditedComment}
                    />
                    <DialogActions>
                      <Button onClick={handleCloseEditComment}>Cancel</Button>
                      <Button onClick={() => { handleConfirmEditComment(comment._id); }} autoFocus>
                        Confirm
                      </Button>
                    </DialogActions>
                  </Dialog>
                </div>
              }
              title={comment.author_username}
            // subheader={comment.created_at}
            />

            <CardContent>
              {/* <Typography variant="body1" color="text.primart">
                
              </Typography> */}
              <Typography variant="body2" color="text.secondary">
                {comment.content}
              </Typography>
            </CardContent>
          </div>
        ))}

        <div className="reply">
          <TextField
            id="outlined-multiline-static"
            label="Reply"
            multiline
            fullWidth
            rows={4}
            onChange={handleChangeNewComment}
          />
          <div className="replyButton">
            <Button variant="contained" startIcon={<ReplyIcon />} onClick={handleSendNewComment}>
              Send
            </Button>
          </div>
        </div>
      </Collapse>
    </Card>
  );
}
