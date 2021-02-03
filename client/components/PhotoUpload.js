import React, { Component } from 'react'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

export default class PhotoUpload extends Component{
    constructor(props){
        super(props)
        this.getPhotoUrl = this.getPhotoUrl.bind(this)
    }
    getPhotoUrl(){
        cloudinary.openUploadWidget({cloudName, uploadPreset, cropping: true},
            (error, result) => { if (!error && result && result.event === 'success') {
                let imageUrl = result.info.secure_url
                if (this.props.type === 'owner') this.props.photoUpload({ userImage1: imageUrl })
                else this.props.photoUpload({ dogImage: imageUrl })
            }
        })
    }
    render(){
        return (
            <button id="upload_widget" onClick={this.getPhotoUrl}>{this.props.action}</button>
        )
    }
}
