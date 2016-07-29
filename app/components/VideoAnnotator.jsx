import React from "react";
import videojs from "video.js";
import "videojs-playlist";
import "videojs-playlist-ui";
import "./videojs.framebyframe.js";
import boundProperties from "./video/bound-properties.js";
import mediaEvents from "./video/media-events.js";
import mediaProperties from "./video/media-properties.js";
import {Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter} from "react-modal-bootstrap"
import AnnotatorNavigation from "./AnnotatorNavigation.jsx";
import FrameLabel from "./FrameLabel.jsx";
import ObjectLabel from "./ObjectLabel.jsx";

var HEIGHT = 240;
var WIDTH = 320;
var SCALING = 2;
var FPS = 5.0;

export default class VideoAnnotator extends React.Component {

  // similar to componentWillMount in ES5
  constructor(props, defaultProps) {
    console.log("VideoAnnotator Contructor");
    super(props, defaultProps);

    this.state = {
      labelInfoList: [],
      currentLabels: [],
      currentFrame: 0,
      numFrames: 0,
      currentItem: 0,
      isOpen: false,
      isPlaying: false
    };

    this.currentKey = 0;
    this.isSaved = true;

    this.handleNewFrameLabels = this.handleNewFrameLabels.bind(this);
    this.handleNewObjectLabels = this.handleNewObjectLabels.bind(this);
    this.handleCloseLabel = this.handleCloseLabel.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleNotSaved = this.handleNotSaved.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleOK = this.handleOK.bind(this);
    this.handleGetCurrentFrame = this.handleGetCurrentFrame.bind(this);
  }

  componentWillMount() {
    console.log("VideoAnnotator componentWillMount");
    this.playlistName = this.props.params.playlistName;
    var range = this.props.params.range.split("-");
    this.start = parseInt(range[0]);
    this.end = parseInt(range[1])+1; // exclusive
  }

  componentDidMount() {
    console.log("VideoAnnotator componentDidMount");
    var self = this;

    console.log(this.props.url)
    fetch(this.props.url, {method: "post"})
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(err => console.error(this.props.url, err.toString()))

    var playlist = [];

    for (var i = self.start; i < self.end; i++) {
      playlist.push({
        "sources": [{
          "src": "/static/video/"+self.playlistName+"/"+i+"/depth.mp4", "type": "video/mp4"
        }],
        "name": "Video "+i,
        "thumbnail": "/static/video/"+self.playlistName+"/"+i+"/thumbnail.jpg"
      });
    }

    self.player = videojs("player", {
      control: true,
      preload: "auto",
      height: HEIGHT*SCALING,
      width: WIDTH*SCALING,
      autoplay: false,
      plugins: {
        framebyframe: {
          fps: 5,
          steps: [
            { text: '-5', step: -5 },
            { text: '-1', step: -1 },
            { text: '+1', step: 1 },
            { text: '+5', step: 5 },
          ]
        }
      }
    }, function() {
      self.player.playlist(playlist);
      self.player.playlistUi();
      boundProperties(self.player);
      mediaEvents(self.player);
      mediaProperties(self.player);
    });

    self.player.on("loadstart", function() {
      console.log("loadstart, is saved: ", self.isSaved);

      var currentItem = parseInt(self.player.currentSrc().split("/")[6]);

      if (currentItem == self.state.currentItem) {
        return;
      } else if (!self.isSaved) {
        self.setState({
          isOpen: true
        });
      } else {
        self.setState({
          labelInfoList: [],
          currentLabels: [],
          currentFrame: 0,
          numFrames: 0,
          currentItem: currentItem,
          isOpen: false,
          isPlaying: false
        });
        console.log("currentItem: ", currentItem);
      }
    });

    self.player.on("durationchange", function() {
      console.log("durationchange");
      self.setState({
        numFrames: Math.round(self.player.duration()*FPS)
      });
    });

    self.player.on("play", function() {
      console.log("disable");
      self.setState({
        isPlaying: true
      });
    });

    self.player.on("pause", function() {
      console.log("enable");
      self.setState({
        isPlaying: false
      });
    });

    self.player.on("timeupdate", function() {
      var currentLabels = [];
      var currentFrame = self.handleGetCurrentFrame();

      for (var i = 0; i < self.state.labelInfoList.length; i++) {
        var option = self.refs["label"+i].getCurrentOption(currentFrame);

        currentLabels.push({
          id: i,
          isFrameLabel: self.state.labelInfoList[i].isFrameLabel,
          option: option // 0 - 1 for frame labels, 0 - 2 for object labels
        });
      }

      self.setState({
        currentLabels: currentLabels,
        currentFrame: currentFrame
      });
    });
  }

  handleCancel() {
    var self = this;

    self.setState({
      isOpen: false
    });
    self.player.playlist.currentItem(self.state.currentItem);
  }

  handleOK() {
    var self = this;
    var currentItem = parseInt(self.player.currentSrc().split("/")[6]);

    self.setState({
      labelInfoList: [],
      currentLabels: [],
      currentFrame: 0,
      currentItem: currentItem,
      isOpen: false,
      isPlaying: false
    });
    self.isSaved = true;
    console.log("currentItem: ", currentItem);
  }

  handleCloseLabel(id) {
    console.log("close", id);
    var self = this;
    var labelInfoList = self.state.labelInfoList;

    labelInfoList.splice(id, 1);

    self.setState({
      labelInfoList: labelInfoList,
    });
    self.isSaved = false;
  }

  handleGetCurrentFrame() {
    var self = this;
    return Math.round(self.player.currentTime()*FPS);
  }

  handleNewFrameLabels() {
    console.log("new frame labels");
    var self = this;
    var labelInfoList = self.state.labelInfoList;

    labelInfoList.push({
      isFrameLabel: true,
      key: self.currentKey
    });
    self.currentKey += 1;

    self.setState({
      labelInfoList: labelInfoList
    });
    self.isSaved = false;

    // Test: send frame data to server on click
    fetch(this.props.urlFrame, {
      method: "post",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        videoId: "12",
        isLabeled: 0, })
    })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(err => console.error(this.props.url, err.toString()));
  }

  handleNewObjectLabels() {
    console.log("new object labels");
    var self = this;
    var labelInfoList = self.state.labelInfoList;

    labelInfoList.push({
      isFrameLabel: false,
      key: self.currentKey
    });
    self.currentKey += 1;

    self.setState({
      labelInfoList: labelInfoList
    });
    self.isSaved = false;
  }

  handleSave() {
    var self = this;
    var data = [];

    for (var i = 0; i < self.state.labelInfoList.length; i++) {
      var labels = self.refs["label"+i].getLabels();
      data.push(labels);
    }
    console.log("saved");
    console.log(data);
  }

  handleNotSaved() {
    this.isSaved = false;
  }

  render() {
    console.log("VideoAnnotator render!!");
    var self = this;

    return (
      <div className="container-fluid video-annotator">
        <AnnotatorNavigation description={self.playlistName+", "+self.start+" - "+(self.end-1)}/>

        <section className="main-preview-player row row-eq-height clearfix">
          <div className="control-panel col-lg-4 col-md-4 col-sm-4" style={{height: HEIGHT*SCALING+"px"}}>
            <div className="row control-panel-buttons">
              <button type="button" className="btn btn-frame new-frame-labels" onClick={self.handleNewFrameLabels}>
                <span className="glyphicon glyphicon-plus-sign"></span> Frame Labels
              </button>
              <button type="button" className="btn btn-object new-object-labels" onClick={self.handleNewObjectLabels}>
                <span className="glyphicon glyphicon-plus-sign"></span> Object Labels
              </button>
              <button type="button" className="btn btn-save save" onClick={self.handleSave}>
                <span className="glyphicon glyphicon glyphicon-floppy-disk"></span> Save
              </button>
            </div>
            {
              self.state.labelInfoList.map(function(labelInfo, index) {
                if (labelInfo.isFrameLabel) {
                  return (
                    <FrameLabel key={labelInfo.key} id={index} ref={"label"+index} getCurrentFrame={self.handleGetCurrentFrame} closeLabel={self.handleCloseLabel} notSaved={self.handleNotSaved} numFrames={self.state.numFrames} isPlaying={self.state.isPlaying} />
                  );
                } else {
                  return (
                    <ObjectLabel key={labelInfo.key} id={index} ref={"label"+index} getCurrentFrame={self.handleGetCurrentFrame} closeLabel={self.handleCloseLabel} notSaved={self.handleNotSaved} numFrames={self.state.numFrames} isPlaying={self.state.isPlaying} />
                  );
                }
              })
            }
          </div>

          <div className="videojs-wrapper col-lg-6 col-md-6 col-sm-6" style={{height: HEIGHT*SCALING+"px"}}>
          {
            self.state.currentLabels.map(function(currentLabel, index) {
              var bg;

              if (currentLabel.isFrameLabel) {
                if (currentLabel.option == 0) {
                  bg = " bg-gray";
                } else if (currentLabel.option == 1) {
                  bg = " bg-danger";
                }
              } else {
                if (currentLabel.option == 0) {
                  bg = " bg-success";
                } else if (currentLabel.option == 1) {
                  bg = " bg-info";
                } else if (currentLabel.option == 2) {
                  bg = " bg-danger";
                }
              }

              return (
                <div className={"small-label"+bg} key={index} style={{left: 76*index+"px"}}>{(currentLabel.isFrameLabel?"Frame":"Object")+currentLabel.id}</div>
              );
            })
          }

            <div className={"small-label-frame bg-gray"}>{self.state.currentFrame+"/"+self.state.numFrames}</div>
            <video id="player" className="video-js" controls preload="auto" crossOrigin="anonymous">
              <p className="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>
            </video>
          </div>

          <ol className="vjs-playlist col-lg-2 col-md-2 col-sm-2" style={{height: HEIGHT*SCALING+"px"}}></ol>
        </section>

        <section className="details">
          <div className="bound-properties col-lg-4 col-md-4 col-sm-4"></div>
          <div className="media-properties col-lg-4 col-md-4 col-sm-4"></div>
          <div className="media-events col-lg-4 col-md-4 col-sm-4"></div>
        </section>

        <Modal isOpen={self.state.isOpen} onRequestHide={self.handleCancel}>
          <ModalHeader>
            <ModalClose onClick={self.handleCancel}/>
            <ModalTitle>Friendly Reminder</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to navigate away from this video and discard the changes?</p>
            <p>Press OK to continue, or Cancel to stay on the current page.</p>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-default" onClick={self.handleCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={self.handleOK}>
              OK
            </button>
          </ModalFooter>
        </Modal>

      </div>
    );
  }
}

AnnotatorNavigation.propTypes = {
  description: React.PropTypes.string.isRequired
};

VideoAnnotator.defaultProps = {
  url: "/videoInfo",
  urlFrame: "/frameLabel"
};
