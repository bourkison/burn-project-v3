<template>
    <div>
        <b-form @submit.prevent="signUp">
            <div class="text-center">
                <div v-if="editingImage">
                    <AvatarEditor :inputImage="fileInput" @addImage="addImage" @cancelEdit="cancelImageEdit" />
                </div>
                <b-form-group description="Upload profile photo">
                    <div v-if="!editingImage">
                        <label for="profilePhotoUpload">
                            <b-avatar v-if="!imageURL" size="9rem" class="profilePhotoUploadAvatar" />
                            <b-avatar v-else size="9rem" class="profilePhotoUploadAvatar" :src="imageURL" />
                        </label>
                    </div>
                    <b-form-file class="d-none" v-model="fileInput" @change="handleFileUpload" id="profilePhotoUpload" />
                </b-form-group>
            </div>

            <b-form-group label="Username" label-for="usernameInput" description="Usernames must be unique.">
                <b-input-group>
                    <b-form-input id="usernameInput" v-model="signUpForm.username" type="text" placeholder="Enter Username" required debounce="250" />
                    <b-input-group-append>
                        <b-button v-if="!checkingUsername && usernameUnique" variant="success" disabled><b-icon-check /></b-button>
                        <b-button v-else-if="!checkingUsername && !usernameUnique" variant="danger" disabled><b-icon-x /></b-button>
                        <b-button v-else-if="checkingUsername" diasbled> <b-spinner small /></b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-form-group>

            <b-form-group label="Email" label-for="emailInput" description="Email is used for sign in and password recovery. We will not send you annoying emails.">
                <b-form-input id="emailInput" v-model="signUpForm.email" type="email" placeholder="Enter Email" required />
            </b-form-group>


            <b-form-group label="Password" :label-for="signUpForm.password && !signUpForm.confPassword ? 'confPasswordInput' : 'passwordInput'" description="Passwords must be at least 8 characters in length.">
                <b-input-group>
                    <b-form-input id="passwordInput" v-model="signUpForm.password" type="password" placeholder="Password" required />
                    <b-form-input id="confPasswordInput" v-model="signUpForm.confPassword" type="password" placeholder="Confirm Password" required />
                </b-input-group>
            </b-form-group>

            <b-form-group label="Name" :label-for="signUpForm.firstName && !signUpForm.surname ? 'surnameInput' : 'firstNameInput'">
                <b-input-group>
                    <b-form-input id="firstNameInput" v-model="signUpForm.firstName" type="text" placeholder="First Name" required />
                    <b-form-input id="surnameInput" v-model="signUpForm.surname" type="text" placeholder="Last Name" required />
                </b-input-group>
            </b-form-group>

            <b-form-group label="Date of Birth" label-for="dobInput">
                <b-form-input id="dobInput" v-model="signUpForm.dob" type="date" required />
            </b-form-group>

            <b-form-group label="Height and Weight" :label-for="signUpForm.height && !signUpForm.weight ? 'weightInput' : 'heightInput'">
                <b-input-group>
                    <b-form-input id="heightInput" v-model="signUpForm.height" type="text" required />
                    <b-input-group-addon is-text>{{ signUpForm.metric ? 'cm' : 'inches' }}</b-input-group-addon>
                    <b-form-input id="weightInput" v-model="signUpForm.weight" type="text" required />
                    <b-input-group-addon is-text>{{ signUpForm.metric ? 'kg' : 'lbs' }}</b-input-group-addon>
                    <b-input-group-append>
                        <b-dropdown variant="outline-dark">
                            <b-dropdown-item @click="signUpForm.metric = true">Metric</b-dropdown-item>
                            <b-dropdown-item @click="signUpForm.metric = false">Imperial</b-dropdown-item>
                        </b-dropdown>
                    </b-input-group-append>
                </b-input-group>
            </b-form-group>

            <b-form-group label="Country" label-for="countryInput">
                <b-form-select id="countryInput" v-model="signUpForm.country" :options="countryList" />
            </b-form-group>

            <b-form-group>
                <b-form-checkbox inline required name="termsCheckbox">
                    I agree to the <a href="#" target="_blank">Terms and Conditions</a>.
                </b-form-checkbox>
            </b-form-group>

            <div class="text-center">
                <b-button type="submit" variant="primary">Sign Up</b-button>
            </div>
        </b-form>
    </div>
</template>

<script>
import { auth, db, functions, storage } from '@/firebase'

import AvatarEditor from '@/components/Utility/AvatarEditor.vue'

export default {
    name: 'SignUpForm',
    components: { AvatarEditor },
    data() {
        return {
            isLoading: true,

            imageURL: null,
            fileInput: null,

            signUpForm: {
                username: '',
                email: '',
                pasword: '',
                confPassword: '',
                firstName: '',
                surname: '',
                dob: '',
                height: '',
                weight: '',
                metric: true,
                country: 'United States'
            },

            usernameUnique: false,
            checkingUsername: false,

            // Bootstrap:
            countryList: ["Afghanistan","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas (the)","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia (Plurinational State of)","Bonaire,int Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory (the)","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Cayman Islands (the)","Central African Republic (the)","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands (the)","Colombia","Comoros (the)","Congo (the Democratic Republic of the)","Congo (the)","Cook Islands (the)","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czechia","Côte d'Ivoire","Denmark","Djibouti","Dominica","Dominican Republic (the)","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands (the) [Malvinas]","Faroe Islands (the)","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories (the)","Gabon","Gambia (the)","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (the)","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran (Islamic Republic of)","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea (the Democratic People's Republic of)","Korea (the Republic of)","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (the)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands (the)","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia (Federated States of)","Moldova (the Republic of)","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands (the)","New Caledonia","New Zealand","Nicaragua","Niger (the)","Nigeria","Niue","Norfolk Island","Northern Mariana Islands (the)","Norway","Oman","Pakistan","Palau","Palestine,tate of","Panama","Papua New Guinea","Paraguay","Peru","Philippines (the)","Pitcairn","Poland","Portugal","Puerto Rico","Qatar","Republic of North Macedonia","Romania","Russian Federation (the)","Rwanda","Réunion","Saint Barthélemy","Saint Helena,scension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan (the)","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syrian Arab Republic","Taiwan","Tajikistan","Tanzania,nited Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands (the)","Tuvalu","Uganda","Ukraine","United Arab Emirates (the)","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela (Bolivarian Republic of)","Vietnam","Virgin Islands (British)","Virgin Islands (U.S.)","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe","Åland Islands"],
            editingImage: false,
        }
    },

    computed: {
        usernameWatcherHandler: function() {
            return this.signUpForm.username;
        }
    },

    methods: {
        handleFileUpload: function(e) {
            this.fileInput = e.target.files[0];
            this.$nextTick(() => { this.editingImage = true; });
        },

        addImage: function(image) {
            this.imageURL = image;
            this.editingImage = false;
            this.fileInput = null;
        },

        cancelImageEdit: function() {
            this.editingImage = false;
            this.fileInput = null;
        },

        signUp: function() {
            this.isLoading = true;

            let userId, imageRef;

            auth.createUserWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password)
            .then(user => {
                userId = user.user.uid;
                if (this.imageURL) {
                    imageRef = storage.ref("users/" + user.user.uid + "/pp/" + (Number(new Date())).toString());
                    return imageRef.putString(this.imageURL, 'data_url');
                } else {
                    console.log("No photo");
                }
            })
            .then(() => {
                if (imageRef) {
                    return imageRef.getDownloadURL().then(url => {
                        this.signUpForm.profilePhoto = url;
                    })
                }
            })
            .then(() => {
                const createUser = functions.httpsCallable("createUser");

                let userPayload = {
                    username: this.signUpForm.username,
                    firstName: this.signUpForm.firstName,
                    surname: this.signUpForm.surname,
                    dob: this.signUpForm.dob,
                    height: this.signUpForm.height,
                    weight: this.signUpForm.weight,
                    country: this.signUpForm.country,
                    metric: this.signUpForm.metric,
                    profilePhoto: this.signUpForm.profilePhoto,
                    gender: this.signUpForm.gender
                }

                return createUser({ userForm: userPayload, userId: userId });
            })
            .then(result => {
                console.log("User created at:" + result.data.userId);
                // As image upload process can take time, we need to sign in again
                // As we have probably been auto signed out due to not having doc data.
                if (!this.$store.state.userProfile.loggedIn) {
                    return auth.signInWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password)
                }
            })
            .then(() => {
                this.isLoading = false;
                this.closeSignUp();
            })
            .catch(e => {
                console.error("Error creating user!", e);
            })
        },

        selectCountry: function(country) {
            this.signUpForm.country = country;
        }
    },

    watch: {
        usernameWatcherHandler: function() {
            if (this.signUpForm.username.trim() !== "") {
                this.checkingUsername = true;

                db.collection("users").where("username", "==", this.signUpForm.username).get()
                .then(userSnapshot => {
                    if (userSnapshot.size > 0) {
                        this.usernameUnique = false;
                    } else {
                        this.usernameUnique = true;
                    }

                    this.checkingUsername = false;
                })
                .catch(e => {
                    console.error("Error checking username uniqueness", e);
                })
            } else {
                this.usernameUnique = false;
            }
        }
    }
}
</script>

<style scoped>
.profilePhotoUploadAvatar:hover,
#countryInput:hover {
    cursor: pointer;
}
</style>