import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, OutgoingEvent, IceCandidateEvent, RTCSession } from "jssip/lib/RTCSession";

import {
  LitElement,
  html,
  css,
  unsafeCSS
} from "lit";
import { customElement } from "lit/decorators.js";

@customElement('ze-sip-doorbell-card')
class ZeSipDoorbellCard extends LitElement {
    sipPhone: UA | undefined;
    sipPhoneSession: RTCSession | null;
    sipCallOptions: any;
    user: any;
    config: any;
    hass: any;
    timerElement: string = "00:00";
    renderRoot: any;
    popup: boolean = false;
    intervalId!: number;
    error: any = null;
    callStatus: string = "Idle";
    user_extension: string = "None";
    card_title: string = "Unknown";
    connected: boolean = false;
    
    doorbellCamera: any;
    secondaryCamera: any;
    pickupExtension: any;

    constructor() {
        super();
        this.sipPhoneSession = null;
    }

    static get properties() {
        return {
            hass: {},
            config: {},
            popup: {
                type: Boolean
            },
            timerElement: {},
            doorbellCamera: {},
            secondaryCamera: {}
        };
    }

    static get styles() {
        return css `
            .wrapper {
                padding: 8px;
                padding-top: 0px;
                padding-bottom: 2px;
            }
            .flex {
                flex: 1;
                margin-top: 6px;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 0;
            }
            .info, .info > * {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .info {
                flex: 1 1 30%;
                cursor: pointer;
                margin-left: 16px;
                margin-right: 8px;
            }
            ha-card {
                cursor: pointer;
            }
            .good {
                color: var(--label-badge-green);
            }
            .warning {
                color: var(--label-badge-yellow);
            }
            .critical {
                color: var(--label-badge-red);
            }
            .icon {
                padding: 0px 18px 0px 8px;
              }
            #phone .content {
                color: white;
            }
            video {
                display: block;
                min-height: 20em;
                height: 100%;
                width: 100%;
            }
            .visualizer-container {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                top: 0;
                display: flex;
                align-items: center;
            }
            .visualizer-bar {
                display: inline-block;
                background: white;
                margin: 0 2px;
                width: 25px;
                min-height: 5px;
            }
            .box {
                /* start paper-font-common-nowrap style */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                /* end paper-font-common-nowrap style */
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(
                  --ha-picture-card-background-color,
                  rgba(0, 0, 0, 0.3)
                );
                padding: 4px 8px;
                font-size: 16px;
                line-height: 40px;
                color: var(--ha-picture-card-text-color, white);
                display: flex;
                justify-content: space-between;
                flex-direction: row;
                margin-top: -70px;
                min-height: 62px;
            }
            .box .title {
                font-weight: 500;
                margin-left: 8px;
            }
            .row {
                display: flex;
                flex-direction: row;
            }
            .container {
                transition: filter 0.2s linear 0s;
                width: 80vw;
            }
            .box, ha-icon {
                display: flex;
                align-items: center;
            }
            .accept-btn {
                color: var(--label-badge-green);
            }
            .hangup-btn {
                color: var(--label-badge-red);
            }
            #time, .title {
                margin-right: 8px;
                display: flex;
                align-items: center;
            }
            ha-camera-stream {
                height: auto;
                width: 100%;
                display: block;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
            }

            .mdc-dialog__surface {
                position: relative;
                display: flex;
                flex-direction: column;
                flex-grow: 0;
                flex-shrink: 0;
                box-sizing: border-box;
                max-width: 100%;
                max-height: 100%;
                pointer-events: auto;
                overflow-y: auto;
            }

            .mdc-dialog__container {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                box-sizing: border-box;
                height: 100%;
                transform: scale(0.8);
                opacity: 0;
                pointer-events: none;
            }

            ha-dialog[data-domain="camera"] {
                --dialog-content-padding: 0;
            }

            ha-dialog[data-domain="camera"] .content, ha-dialog[data-domain="camera"] ha-header-bar {
                width: auto;
            }

            ha-dialog {
                --dialog-surface-position: static;
                --mdc-dialog-max-width: 90vw !important;
                --mdc-dialog-min-width: 400px;
                --mdc-dialog-heading-ink-color: var(--primary-text-color);
                --mdc-dialog-content-ink-color: var(--primary-text-color);
                --justify-action-buttons: space-between;
            }
            
            ha-header-bar {
                --mdc-theme-on-primary: var(--primary-text-color);
                --mdc-theme-primary: var(--mdc-theme-surface);
                flex-shrink: 0;
                display: block;
            }
            .content {
                outline: none;
                align-self: stretch;
                flex-grow: 1;
                display: flex;
                flex-flow: column;
                background-color: var(--secondary-background-color);
            }
            @media all and (max-width: 450px), all and (max-height: 500px) {
                ha-header-bar {
                    --mdc-theme-primary: var(--app-header-background-color);
                    --mdc-theme-on-primary: var(--app-header-text-color, white);
                    border-bottom: none;
                }
            }

            @media all and (max-width: 600px) {
                .heading {
                    border-bottom: 1px solid var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12))
                }
            }

            .heading {
                border-bottom: 1px solid
                    var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
            }
            :host([large]) ha-dialog[data-domain="camera"] .content,
            :host([large]) ha-header-bar {
                width: 90vw;
            }
            @media (max-width: 450px), (max-height: 500px) {
                ha-dialog {
                    --mdc-dialog-min-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                    --mdc-dialog-max-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                    --mdc-dialog-min-height: 94%;
                    --mdc-dialog-max-height: 94%;
                    --vertial-align-dialog: flex-end;
                    --ha-dialog-border-radius: 0px;
                }
            }

            .header-text {
                -webkit-font-smoothing: antialiased;
                font-family: var(--mdc-typography-headline6-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                font-size: var(--mdc-typography-headline6-font-size, 1.25rem);
                line-height: var(--mdc-typography-headline6-line-height, 2rem);
                font-weight: var(--mdc-typography-headline6-font-weight, 500);
                letter-spacing: var(--mdc-typography-headline6-letter-spacing, 0.0125em);
                text-decoration: var(--mdc-typography-headline6-text-decoration, inherit);
                text-transform: var(--mdc-typography-headline6-text-transform, inherit);
                padding-left: 20px;
                padding-right: 0px;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
                z-index: 1;
            }
            
            .popup {
                display: flex;
                flex-wrap: wrap;
                flex-direction: column;
                height: 100%;
            }

            .editField {
                width: 100%;
                margin-left: 16px;
                margin-right: 8px;
            }
        `;
    }

    closePopup() {
        super.performUpdate();
        this.popup = false;
    }

    openPopup() {
        super.performUpdate();
        this.popup = true;
    }

    // allow-exoplayer

    render() {
        return html`
            <audio id="toneAudio" style="display:none" loop controls></audio>
            <audio id="remoteAudio" style="display:none"></audio>
            ${this.popup ? html`
                <style>
                    ha-icon-button {
                        --mdc-icon-button-size: ${this.config.button_size ? unsafeCSS(this.config.button_size) : css`48`}px;
                        --mdc-icon-size: ${this.config.button_size ? unsafeCSS(this.config.button_size - 25) : css`23`}px;
                    }
                </style>
                <div class="popup">
                    <div slot="heading" class="heading">
                        <ha-header-bar>
                            <ha-icon-button
                                style="--mdc-icon-button-size: 48px; --mdc-icon-size: 23px;"
                                @click="${() => this.closePopup()}"
                                slot="navigationIcon"
                                dialogAction="cancel"
                                ><ha-icon icon="mdi:window-close"></ha-icon>
                            </ha-icon-button>
                            <span slot="title" id="name" class="header-text">${this.callStatus}</span>
                            <span slot="actionItems" id="time" class="header-text">${this.timerElement}</span>
                        </ha-header-bar>
                    </div>
                    <div class="content">
                        <div class="box">
                            <div class="row">
                                <ha-icon-button
                                    class="accept-btn"
                                    .label=${"Accept Call"}
                                    @click="${this._answer}"
                                    ><ha-icon icon="hass:phone"></ha-icon>
                                </ha-icon-button>
                            </div>
                            <div class="row">
                                <ha-icon-button
                                    .label=${"Mute audio"}
                                    @click="${this._toggleMuteAudio}"
                                    ><ha-icon id="muteaudio-icon" icon="hass:microphone"></ha-icon>
                                </ha-icon-button>
                            </div>
                            <div class="row">
                                <ha-icon-button
                                    class="hangup-btn"
                                    .label=${"Decline Call"}
                                    @click="${this._hangup}"
                                ><ha-icon icon="hass:phone-hangup"></ha-icon>
                                </ha-icon-button>
                            </div>
                        </div>
                    </div>
                </div>
            ` : html`
                <ha-card>
                    <h1 class="card-header" @click="${this.openPopup}">
                        <span id="title" class="name">${this.getTitle()}</span>
                        <span id="extension" style="color: ${this.getConnectionCSS()};">${this.user?.extension}</span>
                    </h1>
                    <div class="wrapper">

                        <mwc-button @click="${() => this._call(this.config.pickupExtension)}">ATENDER</mwc-button>

                        <ha-camera-stream
                            allow-exoplayer
                            muted
                            .hass=${this.hass}
                            .stateObj=${this.hass.states[this.config.doorbellCamera]}
                        ></ha-camera-stream>
                        
                        <ha-camera-stream
                            allow-exoplayer
                            muted
                            .hass=${this.hass}
                            .stateObj=${this.hass.states[this.config.secondaryCamera]}
                        ></ha-camera-stream>

                        ${(this.error !== null) ? html`
                            <ha-alert alert-type="error" .title=${this.error.title}>
                                ${this.error.message}
                            </ha-alert>
                            ` : ''
                        }

                        ${this.config.extensions.map((extension: { entity: string | number; person: string | number; icon: any; name: any; extension: any; camera: any; }) => {
                            var isMe = (this.hass.user.id == this.hass.states[extension.person].attributes.user_id);
                            if (isMe) this.user = extension;
                        })}

                    </div>
                </ha-card>
            `}
        `
    }

    firstUpdated() {
        this.popup = false;
        this.connect();
    }

    setConfig(config: { server: any; port: any; extensions: any; }): void {
        if (!config.server) {
            throw new Error("You need to define a server!");
        }
        if (!config.port) {
            throw new Error("You need to define a port!");
        }
        if (!config.extensions) {
            throw new Error("You need to define at least one extension!");
        }
        this.config = config;
    }

    static getStubConfig() {
        return {
            server: "192.168.0.10",
            port: "8089",
            button_size: "48",
            state_color: false,
            auto_answer: false,
            hide_me: true,
            custom_title: '',
            video: false,
            custom: [
                {
                    name: 'Custom1',
                    number: '123',
                    icon: 'mdi:phone-classic'
                }
            ],
            dtmfs: [
                {
                    name: 'dtmf1',
                    signal: 1,
                    icon: 'mdi:door'
                }
            ],
            iceTimeout: 5
        };
    }

    getCardSize() {
        return this.config.extensions.length + 1;
    }

    private ring(tone: string) {
        var toneAudio = this.renderRoot.querySelector('#toneAudio');
        if (this.config[tone]) {
            toneAudio.src = this.config[tone];
            toneAudio.currentTime = 0;
            toneAudio.play();
        } else {
            toneAudio.pause();
        }
    }

    private setCallStatus(text: string) {
        this.callStatus = text;
    }

    private getTitle() {
        if (this.config.custom_title != "") {
            return this.config.custom_title;
        } else if (this.user !== undefined && this.user.name !== undefined) {
            return this.user.name;
        } else {
            return "Undefined";
        }
    }

    private getConnectionCSS() {
        if (this.connected) {
            return 'gray'
        } else {
            return 'var(--mdc-theme-error, #db4437)'
        }
    }

    async _call(extension: string | null) {
        this.openPopup();
        this.ring("ringbacktone");
        this.setCallStatus("Calling...");
        if (this.sipPhone) {
            this.sipPhone.call("sip:" + extension + "@" + this.config.server, this.sipCallOptions);
        }
    }

    async _answer() {
        this.sipPhoneSession?.answer();
    }

    async _hangup() {
        this.sipPhoneSession?.terminate();
    }

    async _toggleMuteAudio() {
        if (this.sipPhoneSession?.isMuted().audio) {
            this.sipPhoneSession?.unmute({ video: false, audio: true });
            this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone";
        }
        else {
            this.sipPhoneSession?.mute({ video: false, audio: true });
            this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone-off";
        }
    }

    async _sendDTMF(signal: any) {
        this.sipPhoneSession?.sendDTMF(signal);
    }

    async _button(entity: string) {
        const domain = entity.split(".")[0];
        let service;
        console.log(domain);

        switch(domain) {
            case "script":
                service = "turn_on";
                break;
            case "button":
                service = "press";
                break;
            case "scene":
                service = "turn_on";
                break;
            case "light":
                service = "toggle";
                break;
            case "switch":
                service = "toggle";
                break;
            case "input_boolean":
                service = "toggle";
                break;
            default:
                console.log("No supported service");
                return;
        }
        console.log(service);

        await this.hass.callService(domain, service, {
            entity_id: entity
        });
    }

    endCall() {
        this.ring("pause");
        this.setCallStatus("Idle");
        clearInterval(this.intervalId);
        this.timerElement = "00:00";
        this.closePopup();
        this.sipPhoneSession = null;
    }

    async connect() {
        this.timerElement = "00:00";
        if (this.user == undefined) {
            if (this.config.backup_extension !== undefined) {
                this.user = {
                    name: this.config.backup_name,
                    extension: this.config.backup_extension,
                    secret: this.config.backup_secret
                };
            } else {
                this.error = {
                    title: "Person and backup not configured!",
                    message: "There is no extension configured for this person, and no backup extension configured. Please configure one of them."
                }
                this.requestUpdate();
                throw new Error("Person and backup not configured!");
            }
        }

        this.requestUpdate();

        console.log("Connecting to wss://" + this.config.server + ":" + this.config.port + this.config.prefix + "/ws");
        var socket = new WebSocketInterface("wss://" + this.config.server + ":" + this.config.port + this.config.prefix + "/ws");
        var configuration = {
            sockets : [ socket ],
            uri     : "sip:" + this.user.extension + "@" + this.config.server,
            authorization_user: this.user.extension,
            password: this.user.secret,
            register: true
        };

        this.sipPhone = new UA(configuration);

        this.sipCallOptions = {
            mediaConstraints: { audio: true, video: this.config.video },
            rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: this.config.video },
            pcConfig: this.config.iceConfig // we just use the config that directly comes from the YAML config in the YAML card config.
        };

        console.log('ICE config: ' + JSON.stringify(this.sipCallOptions.pcConfig, null, 2));

        this.sipPhone?.start();

        this.sipPhone?.on("registered", () => {
            console.log('SIP-Card Registered with SIP Server');
            this.connected = true;
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'gray';
        });
        this.sipPhone?.on("unregistered", () => {
            console.log('SIP-Card Unregistered with SIP Server');
            this.connected = false;
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'var(--mdc-theme-primary, #03a9f4)';
        });
        this.sipPhone?.on("registrationFailed", () => {
            console.log('SIP-Card Failed Registeration with SIP Server');
            this.connected = false;
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'var(--mdc-theme-error, #db4437)';
        });
        this.sipPhone?.on("newRTCSession", (event: RTCSessionEvent) => {
            if (this.sipPhoneSession !== null ) {
                event.session.terminate();
                return;
            }

            console.log('Call: newRTCSession: Originator: ' + event.originator);

            this.sipPhoneSession = event.session;

            this.sipPhoneSession.on('getusermediafailed', function(DOMError) {
                console.log('getUserMedia() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:createofferfailed', function(DOMError) {
                console.log('createOffer() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:createanswerfailed', function (DOMError) {
                console.log('createAnswer() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:setlocaldescriptionfailed', function (DOMError) {
                console.log('setLocalDescription() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:setremotedescriptionfailed', function (DOMError) {
                console.log('setRemoteDescription() failed: ' + DOMError);
            });

            this.sipPhoneSession.on("confirmed", (event: IncomingEvent | OutgoingEvent) => {
                console.log('Call confirmed. Originator: ' + event.originator);
            });

            this.sipPhoneSession.on("failed", (event: EndEvent) =>{
                console.log('Call failed. Originator: ' + event.originator);
                this.endCall();
            });

            this.sipPhoneSession.on("ended", (event: EndEvent) => {
                console.log('Call ended. Originator: ' + event.originator);
                this.endCall();
            });

            this.sipPhoneSession.on("accepted", (event: IncomingEvent | OutgoingEvent) => {
                console.log('Call accepted. Originator: ' + event.originator);
                if (!this.config.video) {
                    let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
                }
                this.ring("pause");
                if (this.sipPhoneSession?.remote_identity) {
                    this.setCallStatus(this.sipPhoneSession?.remote_identity.display_name);
                } else {
                    this.setCallStatus("On Call");
                }
                var time = new Date();
                this.intervalId = window.setInterval(function(this: any): void {
                    var delta = Math.abs(new Date().getTime() - time.getTime()) / 1000;
                    var minutes = Math.floor(delta / 60) % 60;
                    delta -= minutes * 60;
                    var seconds = delta % 60;
                    this.timerElement = (minutes + ":" + Math.round(seconds)).split(':').map(e => `0${e}`.slice(-2)).join(':');
                }.bind(this), 1000);
            });

            var iceCandidateTimeout: NodeJS.Timeout | null = null;
            var iceTimeout = 5;
            if (this.config.iceTimeout !== null && this.config.iceTimeout !== undefined)
            {
                iceTimeout = this.config.iceTimeout;
            }

            console.log('ICE gathering timeout: ' + iceTimeout + " seconds");

            this.sipPhoneSession.on("icecandidate", (event: IceCandidateEvent) => {
                console.log('ICE: candidate: ' + event.candidate.candidate);

                if (iceCandidateTimeout != null) {
                    clearTimeout(iceCandidateTimeout);
                }

                iceCandidateTimeout = setTimeout(() => {
                    console.log('ICE: stop candidate gathering due to application timeout.');
                    event.ready();
                }, iceTimeout * 1000);
            });

            let handleIceGatheringStateChangeEvent = (event: any): void => {
                let connection = event.target;

                console.log('ICE: gathering state changed: ' + connection.iceGatheringState);

                if (connection.iceGatheringState === 'complete') {
                    console.log('ICE: candidate gathering complete. Cancelling ICE application timeout timer...');
                    if (iceCandidateTimeout != null) {
                        clearTimeout(iceCandidateTimeout);
                    }
                }
            };

            let handleRemoteTrackEvent = async (event: RTCTrackEvent): Promise<void> => {
                console.log('Call: peerconnection: mediatrack event: kind: ' + event.track.kind);

                let stream: MediaStream | null = null;
                if (event.streams) {
                    console.log('Call: peerconnection: mediatrack event: number of associated streams: ' + event.streams.length + ' - using first stream');
                    stream = event.streams[0];
                }
                else {
                    console.log('Call: peerconnection: mediatrack event: no associated stream. Creating stream...');
                    if (!stream) {
                        stream = new MediaStream();
                    }
                    stream.addTrack(event.track);
                }

                let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
                if (event.track.kind === 'audio' && remoteAudio.srcObject != stream) {
                    remoteAudio.srcObject = stream;
                    try {
                        await remoteAudio.play();
                    }
                    catch (err) {
                        console.log('Error starting audio playback: ' + err);
                    }
                }

                let remoteVideo = this.renderRoot.querySelector('#remoteVideo');
                if (this.config.video && event.track.kind === 'video' && remoteVideo.srcObject != stream) {
                    remoteVideo.srcObject = stream;
                    try {
                        await remoteVideo.play()
                    }
                    catch (err) {
                        console.log('Error starting video playback: ' + err);
                    }
                }
            }

            // Typescript types for enums seem to be broken for JsSIP.
            // See: https://github.com/versatica/JsSIP/issues/750
            if (this.sipPhoneSession.direction === 'incoming') {
                this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                    console.log('Call: peerconnection(incoming)');

                    event.peerconnection.addEventListener("track", handleRemoteTrackEvent);
                    event.peerconnection.addEventListener("icegatheringstatechange", handleIceGatheringStateChangeEvent);
                });

                this.openPopup();
                if (this.config.auto_answer) {
                    this.sipPhoneSession.answer(this.sipCallOptions);
                    return;
                }

                this.ring("ringtone");

                if (this.sipPhoneSession.remote_identity) {
                    this.setCallStatus("Incoming Call From " + this.sipPhoneSession.remote_identity.display_name);
                } else {
                    this.setCallStatus("Incoming Call");
                }
            }
            else if (this.sipPhoneSession.direction === 'outgoing') {
                //Note: peerconnection seems to never fire for outgoing calls
                this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                    console.log('Call: peerconnection(outgoing)');
                });

                this.sipPhoneSession.connection.addEventListener("track", handleRemoteTrackEvent);
                this.sipPhoneSession.connection.addEventListener("icegatheringstatechange", handleIceGatheringStateChangeEvent);
            }
            else {
                console.log('Call: direction was neither incoming or outgoing!');
            }
        });
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "ze-sip-doorbell-card",
    name: "Ze Doorbell Card",
    preview: false,
    description: "A SIP card, made by Jordy Kuhne and edited by Ze."
});
