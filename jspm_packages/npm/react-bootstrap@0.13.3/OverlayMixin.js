/* */ 
var React = require("react");
var CustomPropTypes = require("./utils/CustomPropTypes");
module.exports = {
  propTypes: {container: CustomPropTypes.mountable},
  getDefaultProps: function() {
    return {container: {getDOMNode: function getDOMNode() {
          return document.body;
        }}};
  },
  componentWillUnmount: function() {
    this._unrenderOverlay();
    if (this._overlayTarget) {
      this.getContainerDOMNode().removeChild(this._overlayTarget);
      this._overlayTarget = null;
    }
  },
  componentDidUpdate: function() {
    this._renderOverlay();
  },
  componentDidMount: function() {
    this._renderOverlay();
  },
  _mountOverlayTarget: function() {
    this._overlayTarget = document.createElement('div');
    this.getContainerDOMNode().appendChild(this._overlayTarget);
  },
  _renderOverlay: function() {
    if (!this._overlayTarget) {
      this._mountOverlayTarget();
    }
    var overlay = this.renderOverlay();
    if (overlay !== null) {
      this._overlayInstance = React.render(overlay, this._overlayTarget);
    } else {
      this._unrenderOverlay();
    }
  },
  _unrenderOverlay: function() {
    React.unmountComponentAtNode(this._overlayTarget);
    this._overlayInstance = null;
  },
  getOverlayDOMNode: function() {
    if (!this.isMounted()) {
      throw new Error('getOverlayDOMNode(): A component must be mounted to have a DOM node.');
    }
    if (this._overlayInstance) {
      return this._overlayInstance.getDOMNode();
    }
    return null;
  },
  getContainerDOMNode: function() {
    return this.props.container.getDOMNode ? this.props.container.getDOMNode() : this.props.container;
  }
};
