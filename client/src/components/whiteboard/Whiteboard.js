import React from 'react'
import '../../styles/whiteboard.css'
import M from 'materialize-css';
import isEmpty from '../../utils/is-empty';

const canvasWidth = 1500;
const canvasHeight = 1000;

let context2D = null;
let background = '#fff';

class Whiteboard extends React.Component {

    constructor(props) { 
        super(props)
        this.state = {
            canvas: null,
            context2D: null,
            lastX: null,
            lastY: null,
            color: '#55aae6',
            size: 30,
            clearing: false,
            allowEditing: false,
            boardStatus: '',
            loading: false,
            updated: false,
        }
    }

    componentDidMount() {
        const canvas = document.querySelector("#canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context2D = canvas.getContext("2d");
       
        // draw background
        context2D.fillStyle = background;
        context2D.fillRect(0, 0, canvas.width, canvas.height); 

        this.setState({ canvas });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.socket) {
            nextProps.socket.on('get-draw-board', (board, who) =>{
                let { room, users } = this.props;
    
                if (users && users[who]) {
                    let msg = `${users[who].name} is drawing`
                    this.setState({ boardStatus: msg });
                }
                this.drawJob(board);

                if (users && users[who]) setTimeout(() => this.setState({ boardStatus: '' }), 5000)
            })

            // nextProps.socket.emit('get-entire-board');

            // nextProps.socket.on('entire-board', board => {
            //     if (board && !this.state.updated) {
            //         console.log(board)
            //         this.setState({ loading: true, updated: true })

            //         if (board.drawing) {
            //             for (let drawObject of board.drawing) {
            //                 this.drawJob(drawObject);
            //             }
            //         }
            //         this.setState({ loading: false, allowEditing: !isEmpty(board.status) ? board.status : this.state.allowEditing });
            //     }
            // })

            nextProps.socket.on('erase-board', () => {
                Whiteboard.eraseBoard();
            })

            nextProps.socket.on('get-editing-status', status => {
                this.setState({ allowEditing: status })
            })
        } 
        
        if (nextProps.leaving) {
            if (nextProps.leaving == 'yes' && this.state.allowEditing) {
                console.log('leave')
                this.setState({ allowEditing: false });
                this.sendStatus(false);
            }
        }
    }

    drawJob = board => {
        setTimeout(function(board) {
            return function() { Whiteboard.drawOnBoard(board) }
        }(board), 0);
    }
        
    static drawOnBoard = drawObject => {
        if (drawObject && drawObject.lastX != null && drawObject.lastY != null) {            
            context2D.beginPath();
            context2D.strokeStyle = drawObject.color;
            
            if (drawObject.clearing) {
                context2D.strokeStyle = background;
            }
            context2D.lineJoin = 'round';
            context2D.lineWidth = drawObject.size;
            context2D.moveTo(drawObject.lastX, drawObject.lastY);
            context2D.lineTo(drawObject.x, drawObject.y);
            context2D.closePath();
            context2D.stroke();
        }
    }

    isAuthorized = () => {
        let { allowEditing } = this.state;
        let { isOwner } = this.props;
        
        if (isOwner || allowEditing) return true;
        else return false;
    }

    onChange = (e, checkbox=false) => {
        let {name, checked, value} = e.target;

        if (name == 'allowEditing') {
            this.sendStatus(checked)
        }

        this.setState({ [name]: checkbox ? checked : value })
    }

    sendStatus = checked => {
        let { socket } = this.props;
        socket && socket.emit('send-editing-status', checked)
    }

    onMouseDown = e => {
        e.preventDefault();

        let { canvas } = this.state;
        
        if (!canvas || !this.isAuthorized()) return;
        
        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;
    
        let lastX = (e.pageX - canvas.offsetLeft) * scalingX;
        let lastY = (e.pageY - canvas.offsetTop) * scalingY;

        this.setState({ lastX, lastY });
    }
    
    onTouchStart = e => {
        e.preventDefault();
        
        let { canvas } = this.state;
        if (!canvas || !this.isAuthorized()) return;

        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;

        let lastX = (e.targetTouches[0].pageX - canvas.offsetLeft) * scalingX;
        let lastY = (e.targetTouches[0].pageY - canvas.offsetTop) * scalingY;

        this.setState({ lastX, lastY });
        return false;
    }
    
    onMouseMove = e => {
        e.preventDefault();

        let { canvas } = this.state;
        if (!canvas || !this.isAuthorized()) return;

        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;

        let x = (e.pageX - canvas.offsetLeft) * scalingX;
        let y = (e.pageY - canvas.offsetTop) * scalingY;

        this.prepareToDraw(x,y);
    }

    onTouchMove = e => {
        e.preventDefault();

        let { canvas } = this.state;
        if (!canvas || !this.isAuthorized()) return;

        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;

        let x = (e.targetTouches[0].pageX - canvas.offsetLeft) * scalingX;
        let y = (e.targetTouches[0].pageY - canvas.offsetTop) * scalingY;

        this.prepareToDraw(x,y);

        return false;
    }


    onRelease = (e=false) => {
        if (e) e.preventDefault();
        if (!this.isAuthorized()) return;
        this.setState({ lastX: null, lastY: null })
        return false;
    }

    prepareToDraw = (x,y) => {
        let { lastX, lastY, color, size, clearing, allowEditing } = this.state;
        let { room } = this.props;

        if (lastX != null && lastY != null) {        
            let drawObject= {};
            drawObject.id = room._id;
            drawObject.lastX = lastX;
            drawObject.lastY = lastY;
            drawObject.x = x;
            drawObject.y = y;
            drawObject.color = color;
            drawObject.size = size;
            drawObject.clearing = clearing;
            this.sendDrawing(drawObject)
            Whiteboard.drawOnBoard(drawObject);
            this.setState({ lastX: x, lastY: y })
        }
    }

    sendDrawing = drawObject => {
        let { socket } = this.props;
        socket && socket.emit('on-draw-board', drawObject)
    }

    downloadBoard = () => {
        let { canvas } = this.state;
        if (!canvas) return;

        document.getElementById("save-board").href = canvas.toDataURL();
        document.getElementById("save-board").download = "whiteboard.png";
    }

    eraseEvent = () => {
        if (!this.isAuthorized()) return;

        let { socket } = this.props
        socket && socket.emit('on-erase-board');
        Whiteboard.eraseBoard();
    }

    static eraseBoard = () => {
        context2D.fillStyle = background;
        context2D.fillRect(0, 0, canvasWidth, canvasHeight); 
    }

    render () {
        let { loading, boardStatus, allowEditing } = this.state;
        let { isOwner } = this.props;

        return (
            <>
                <canvas onTouchStart= {this.onTouchStart} onTouchMove={this.onTouchMove} onMouseMove={this.onMouseMove} onMouseDown={this.onMouseDown} onMouseUp={this.onRelease} onTouchEnd={this.onRelease} onTouchCancel={this.onRelease} width="1024" height="512" id="canvas"></canvas>
                <div className="toolbar">
                    <div className="row">
                        <div className="col s3"/>
                        <div className="col s6">
                            <h5 className="heading me">
                                {!isOwner && !allowEditing ? 'Watching Mode' 
                                : !isOwner && allowEditing ? 'You Can Draw!' 
                                : isOwner && allowEditing ? 'Others can now draw' : null }
                            </h5>
                        </div>
                        <div className="col s3"/>
                    </div>
                    <div className="row">
                        { isOwner || allowEditing ? (
                                <> 
                                    <div className="col">
                                        <div className="input-field">
                                            Colour: <input name="color" onChange={this.onChange} type="color" value={this.state.color}/>
                                        </div>
                                    </div>
                                    <div className="col s3">
                                        <p className="range-field">
                                            <label>Brush size: </label>
                                            <input name="size" onChange={this.onChange} type="range" min="5" max="50" value={this.state.size}/>
                                        </p>
                                    </div>
                                    <div className="col s2">
                                        <p>
                                            <label>
                                                <input type="checkbox" name="clearing" onChange={e => this.onChange(e, 'checkbox')} checked={this.state.clearing} />
                                                <span>Eraser</span>
                                            </label>
                                        </p>
                                    </div>
                                </>
                            ) : null
                        }
                        { isOwner && (
                            <div className="col s5">
                                <div className="switch">
                                    <label>
                                        Only allow me to draw
                                        <input type="checkbox" name="allowEditing" checked={this.state.allowEditing} onChange={e => this.onChange(e, 'checkbox')}/>
                                        <span className="lever"></span>
                                        Allow others to draw
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="center">
                        <div className="col s3"/> 
                        <div className="col">
                            <a onClick={() => this.downloadBoard()} className="btn blue lighten-1" id="save-board" href="javascript:void(0);">Download</a>
                        </div>

                        { isOwner || allowEditing ? (
                            <div className="col">
                                <a onClick={() => this.eraseEvent()} className="btn red lighten-1" href="javascript:void(0);">Erase</a>
                            </div>
                        ) : null}

                        <div className="col s3">
                            <span className="me">
                                { loading ? 'Loading...' : boardStatus ? boardStatus : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default Whiteboard