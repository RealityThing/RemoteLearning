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
            touching: false,
            drawing: [],
            strokeStarted: false
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
        document.body.addEventListener('touchmove', e => {
            if (this.state.touching) {
                console.log('prevent')
                e.preventDefault()
                return false
            } 
            return true;

        }, { passive: false });

        this.setState({ canvas });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.socket) {
            nextProps.socket.on('get-draw-board', (board, who) =>{
                let { users } = this.props;
    
                if (users && users[who]) {
                    let msg = `${users[who].name} is drawing`
                    this.setState({ boardStatus: msg });
                }
                
                this.setState({ drawing: [...this.state.drawing, board]})
                this.drawJob(board);

                if (users && users[who]) setTimeout(() => this.setState({ boardStatus: '' }), 5000)
            })

            nextProps.socket.emit('get-entire-board');

            nextProps.socket.on('entire-board', board => {
                if (board && !this.state.updated) {
                    console.log(board)

                    if (board.drawing) {
                        this.setState({ loading: true, updated: true, drawing: board.drawing })

                        for (let drawObject of board.drawing) {
                            this.drawJob(drawObject);
                        }
                    }
                    this.setState({ loading: false, allowEditing: !isEmpty(board.status) ? board.status : this.state.allowEditing });
                }
            })

            nextProps.socket.on('erase-board', () => {
                this.setState({ drawing: [] })
                Whiteboard.eraseBoard();
            })

            nextProps.socket.on('get-editing-status', status => {
                this.setState({ allowEditing: status })
            })
            
            nextProps.socket.on('new-undo', removeSketch => {
                for (let drawObject of removeSketch) {
                    this.drawJob(drawObject, 'undo');
                }
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

    drawJob = (board, undo=false) => {
        setTimeout(function(board) {
            return function() { Whiteboard.drawOnBoard(board, undo) }
        }(board), 0);
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

        let { canvas, drawing, strokeStarted } = this.state;
        
        if (!canvas || !this.isAuthorized()) return;
        
        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;
    
        let lastX = (e.pageX - canvas.offsetLeft) * scalingX;
        let lastY = (e.pageY - canvas.offsetTop) * scalingY;

        if (!strokeStarted && drawing[-1] !== 'start') this.setState({ drawing: [...drawing, 'start' ], strokeStarted: true })
        this.setState({ lastX, lastY });
    }
    
    onTouchStart = e => {
        e.preventDefault();

        let { canvas, touching, drawing, strokeStarted } = this.state;
        if (!touching) this.setState({ touching: true });

        if (!canvas || !this.isAuthorized()) return;

        let scalingX = canvasWidth / canvas.clientWidth;
        let scalingY = canvasHeight / canvas.clientHeight;

        let lastX = (e.targetTouches[0].pageX - canvas.offsetLeft) * scalingX;
        let lastY = (e.targetTouches[0].pageY - canvas.offsetTop) * scalingY;

        if (!strokeStarted && drawing[-1] !== 'start') this.setState({ drawing: [...drawing, 'start' ], strokeStarted: true })

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

    prepareToDraw = (x,y) => {
        let { lastX, lastY, color, size, clearing, drawing } = this.state;
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
            this.setState({ lastX: x, lastY: y, drawing: [...drawing, drawObject] })
        }
    }

    static drawOnBoard = (drawObject, undo=false) => {
        if (drawObject && drawObject.lastX != null && drawObject.lastY != null) {            
            context2D.beginPath();
            context2D.strokeStyle = drawObject.color;
          
            if (drawObject.clearing) {
                context2D.strokeStyle = background;
            }
              
            if (undo) {
                context2D.strokeStyle = background;
                context2D.lineWidth = drawObject.size+3;
            } else {
                context2D.lineWidth = drawObject.size;
            }

            context2D.lineJoin = 'round';
            context2D.moveTo(drawObject.lastX, drawObject.lastY);
            context2D.lineTo(drawObject.x, drawObject.y);
            context2D.closePath();
            context2D.stroke();
        }
    }

    sendDrawing = drawObject => {
        let { socket } = this.props;
        socket && socket.emit('on-draw-board', drawObject)
    }

    onRelease = (e=false) => {
        if (e) e.preventDefault();
        if (!this.isAuthorized()) return;
        let { drawing } = this.state;

        if (drawing.length && drawing[-1] !== 'start' && drawing[-1] !== 'end') this.setState({ lastX: null, lastY: null, drawing: [...drawing, 'end'], strokeStarted: false });
        if (this.state.touching) this.setState({ touching: false })

        document.body.removeEventListener('touchmove', e => e.preventDefault(), { passive: false });
        return false;
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
        this.setState({ drawing: [] });
        socket && socket.emit('on-erase-board');
        Whiteboard.eraseBoard();
    }

    isDrawObject = drawObject => drawObject.x && drawObject.y

    goBack = () => {
        let _drawings = [...this.state.drawing]
        let { socket } = this.props
        let removeSketch = [];

        let endIndex = -1;
        
        for (let i = _drawings.length - 1; i >= 0; i--) {
            if (_drawings[i] == 'end') endIndex = i;
            else if (_drawings[i] == 'start' && endIndex !== -1) {
                removeSketch = _drawings.splice(i, endIndex +1)
                let drawingsWNoLabels = _drawings.filter(obj => this.isDrawObject(obj))
                socket.emit('undo-sketch', removeSketch, drawingsWNoLabels)
                this.setState({ drawing: _drawings })
                break
            }
        }

        for (let drawObject of removeSketch) {
            this.drawJob(drawObject, 'undo');
        }
    }

    static eraseBoard = () => {
        context2D.fillStyle = background;
        context2D.fillRect(0, 0, canvasWidth, canvasHeight); 
    }

    render () {
        let { loading, boardStatus, allowEditing } = this.state;
        let { isOwner, mobileScreen } = this.props;

        return (
            <>
                <canvas onTouchStart={e => this.onTouchStart(e)} onTouchMove={e => this.onTouchMove(e)} onMouseMove={this.onMouseMove} onMouseDown={this.onMouseDown} onMouseUp={this.onRelease} onTouchEnd={this.onRelease} onTouchCancel={this.onRelease} width="1024" height="512" id="canvas"></canvas>
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
                                        <div className="input-field small-text">
                                            Color<input name="color" onChange={this.onChange} type="color" value={this.state.color}/>
                                        </div>
                                    </div>
                                    
                                    <div className="col s3">
                                        <p className="range-field">
                                            <label className="small-text">Brush Size </label>
                                            <input name="size" onChange={this.onChange} type="range" min="5" max="50" value={this.state.size}/>
                                        </p>
                                    </div>
                                    <div className="col">
                                        <a className="color-grey" href="javascript:void(0);" onClick={() => this.goBack()} >
                                            <i className="material-icons right">undo</i> 
                                        </a>
                                    </div>
                                    <div className="col s2">
                                        <p>
                                            <label className="small-text">
                                                {mobileScreen && 'Eraser'}
                                                <input type="checkbox" name="clearing" onChange={e => this.onChange(e, 'checkbox')} checked={this.state.clearing} />
                                                <span>{!mobileScreen && 'Eraser'}</span>
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
                            <a onClick={() => this.downloadBoard()} className="btn blue lighten-1" id="save-board" href="javascript:void(0);">Download board</a>
                        </div>

                        { isOwner || allowEditing ? (
                            <>
                            <div className="col">
                                <a onClick={() => this.eraseEvent()} className="btn red lighten-1" href="javascript:void(0);">Erase board</a>
                            </div>
                            </>
                        ) : null}

                        <div className="col s6 m3 l3">
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