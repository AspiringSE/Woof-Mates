/* eslint-disable max-params */
import axios from 'axios';

//User State

const REGISTER_USER = 'REGISTER_USER';
const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';
const UPDATE = 'UPDATE';
const GET_USER = 'GET_USER';
const POST_TESTIMONIAL = 'POST_TESTIMONIAL'
const MAPQUEST_KEY = process.env.MAPQUEST_KEY;

const _login = (user) => {
    return {
        type: LOGIN,
        user
    }
};

const _logout = (emptyUser) => {
  return {
      type: LOGOUT,
      emptyUser
  }
};

const registerAUser = (user) => {
  return {
      type: REGISTER_USER,
      user
  }
};

export const registerUser = (userInfo) => {
  return async(dispatch) => {
    try {
      console.log('USERINFO PASSED IN:')
      console.log(userInfo)
      const { zipCode } = userInfo
      // mapquest API to get latitude and longitude from user zipcode
      const mapQuestInfo = (await axios.get(`https://www.mapquestapi.com/geocoding/v1/address?key=${MAPQUEST_KEY}&location=${zipCode}%2C+US&thumbMaps=true`)).data
      userInfo.userLatitude = mapQuestInfo.results[0].locations[0].latLng.lat;
      userInfo.userLongitude = mapQuestInfo.results[0].locations[0].latLng.lng;

      const newUser = (await axios.post('/api/users/register', userInfo)).data
      dispatch(registerAUser(newUser))
    }
    catch (error) {
      console.log(error)
    }
  }
}

export const login = (loginInfo) => async(dispatch) => {
  try {
      const { data } = await (axios.post('/api/auth/login', loginInfo))
      dispatch(_login(data))
  } catch (err) {
      alert('Email and password do not match. Please try again.');
      console.error(err);
  }
};

export const logout = (userId) => async(dispatch) => {
  try {
      await (axios.delete(`/api/auth/logout/${userId}`))
      dispatch(_logout({}))
  } catch (err) {
      console.error(err);
  }
}

const updateUser = (user) => {
  return {
    type: UPDATE,
    user
  }
}

export const editProfile = (userId, updatedProfile) => async(dispatch) => {
  try {
    await (axios.put(`/api/users/${userId}`, updatedProfile));
    let updatedUser = await (axios.get(`/api/users/${userId}`))
    dispatch(updateUser(updatedUser.data));
  } catch (err) {
    console.log(err)
  }
}

const _getUser = (user) => {
  return {
  type: GET_USER,
  user
}}

export const getUser = () => {
  return async(dispatch) => {
      const res = await axios.get('/api/users/get-user')
      dispatch(_getUser(res.data))
  }
}

export default function userReducer (state = {}, action) {
  switch (action.type) {
      case UPDATE:
        return action.user;
      case REGISTER_USER:
          return action.user
      case LOGIN:
        return action.user;
      case LOGOUT:
        return action.emptyUser;
      case GET_USER:
        return action.user
      case POST_TESTIMONIAL:
        return action.user
      default:
        return state
  }
}
