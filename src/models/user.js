import { delay } from '@/utils/utils';
import storage from '@/utils/storage';
import _ from 'lodash';
import router from 'umi/router';
import * as userService from '@/services/user';
import { message } from 'antd';

export default {
    namespace: 'user',
    state: null,
    effects: {
        *fetch({ payload }, { call, put }) {
            const { callback } = payload;
            const response = yield call(userService.fetch);
            if (response) {
                const user = response.data;
                const token = storage.getToken();
                yield put({ type: 'save', payload: { ...user, token } });
                if (callback) callback();
                yield put({ type: 'authorized/success '});
                // const items = storage.getShoppingCart();
                // if (!_.isEmpty(items)) {
                //     yield put({
                //         type: 'cart/fetch',
                //         payload: items
                //     });
                // }
                // FCM token
            }
        },
        *update({ payload }, { call, put }) {
            const response = yield call(userService.update, payload);
            if (response) {
                yield put({
                    type: 'updateUser',
                    payload: response.data
                });
            }
        },
        *updateCatesOfConcern({ payload: targetKeys }, { call, put }) {
            const response = yield call(userService.updateInterestedCates, targetKeys);
            if (response) {
                const catesOfConcern = response.data && response.data.catesOfConcern;
                yield put({
                    type: 'updateUser',
                    payload: {
                        catesOfConcern
                    }
                });
            }
        },
        *changePassword({ payload }, { call, put }) {
            const {
                oldPassword,
                newPassword,
                onOk,
                onIncorrect
            } = payload;
            const response = yield call(userService.updatePassword, oldPassword, newPassword);
            if (response) {
                const errorCode = 1 * response.errorCode;
                if (errorCode === 0)
                    onOk();
                else
                    onIncorrect();
            }
        },
        *uploadAvatar({ payload }, { call, put }) {
            const { file, callback } = payload;
            //call api to upload file (Base64) to cloud, get url
            yield delay(1000);
            const avatarUrl = 'https://images.pexels.com/photos/2451616/pexels-photo-2451616.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260';
            const response = yield call(userService.updateAvatar, avatarUrl);
            if (response) {
                yield put({
                    type: 'updateUser',
                    payload: response.data
                });
                if (callback) callback();
            }
        },
        *login({ from, payload }, { call, put }) {
            const { phone, password } = payload;
            const response = yield call(userService.signIn, phone, password);
            if (response) {
                const user = response.data;
                const token = user.token;
                storage.setToken(token);
                yield put({
                    type: 'save',
                    payload: user
                });
                //set FCM token
                yield put({ type: 'authorized/success '});
                router.replace(from);
            }
        },
        *register({ payload }, { call }) {
            const response = yield call(userService.register, payload);
            if (response) {
                message.success('Register success!');
                router.push('/user/login');
            }
        },
        *logout(action, { put }) {
            storage.setToken(null);
            storage.setShoppingCart(null);
            router.push('/user/login');
            yield put({ type: 'reset' });
            yield put({ type: 'cart/reset' });
        }
    },
    reducers: {
        save(state, { payload }) {
            return { ...payload };
        },
        saveNoUsMessage(state, { payload }) {
            return {
                ...state,
                noUsMessage: payload
            };
        },
        saveNoUsNotification(state, { payload }) {
            return {
                ...state,
                noUsNotification: payload
            };
        },
        updateUser(state, { payload }) {
            return {
                ...state,
                ...payload
            };
        },
        reset() {
            return null;
        }
    }
}