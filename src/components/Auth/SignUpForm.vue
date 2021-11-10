<template>
    <div>
        <div class="mb-4">
            <b-progress :value="progressAmount" :max="100" class="mb-2" height="0.5rem" />
            <b-row class="font-size-8">
                <b-col cols="4" class="text-center">
                    <b-icon-circle-fill variant="primary" v-if="progressAmount >= 15" />
                    <b-icon-circle variant="primary" v-else /><br />
                    Sign Up
                </b-col>
                <b-col cols="4" class="text-center">
                    <b-icon-circle-fill variant="primary" v-if="progressAmount >= 50" />
                    <b-icon-circle variant="primary" v-else /><br />
                    Verify
                </b-col>
                <b-col cols="4" class="text-center">
                    <b-icon-circle-fill variant="primary" v-if="progressAmount >= 86" />
                    <b-icon-circle variant="primary" v-else /><br />
                    Final
                </b-col>
            </b-row>
        </div>
        <div v-if="progressAmount === 15">
            <b-form @submit.prevent="signUp">
                <b-form-group
                    label="Username"
                    label-for="usernameInput"
                    description="Usernames must be unique."
                >
                    <b-input-group>
                        <b-form-input
                            id="usernameInput"
                            v-model="signUpForm.username"
                            type="text"
                            placeholder="Enter Username"
                            required
                            debounce="250"
                            :disabled="isCreating"
                        />
                        <b-input-group-append>
                            <b-button
                                v-if="!checkingUsername && usernameUnique"
                                variant="success"
                                disabled
                                ><b-icon-check
                            /></b-button>
                            <b-button
                                v-else-if="!checkingUsername && !usernameUnique"
                                variant="danger"
                                disabled
                                ><b-icon-x
                            /></b-button>
                            <b-button v-else-if="checkingUsername" disabled>
                                <b-spinner small
                            /></b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>

                <b-form-group
                    label="Email"
                    label-for="emailInput"
                    description="Email is used for sign in and password recovery. We will not send you annoying emails."
                >
                    <b-form-input
                        id="emailInput"
                        v-model="signUpForm.email"
                        type="email"
                        placeholder="Enter Email"
                        required
                        :disabled="isCreating"
                    />
                </b-form-group>

                <b-form-group
                    label="Password"
                    :label-for="
                        signUpForm.password && !signUpForm.confPassword
                            ? 'confPasswordInput'
                            : 'passwordInput'
                    "
                    description="Passwords must be at least 8 characters in length."
                >
                    <b-input-group>
                        <b-form-input
                            id="passwordInput"
                            v-model="signUpForm.password"
                            type="password"
                            placeholder="Password"
                            required
                            :disabled="isCreating"
                        />
                        <b-form-input
                            id="confPasswordInput"
                            v-model="signUpForm.confPassword"
                            type="password"
                            placeholder="Confirm Password"
                            required
                            :disabled="isCreating"
                        />
                        <b-input-group-append>
                            <b-button
                                v-if="
                                    signUpForm.password === signUpForm.confPassword &&
                                        signUpForm.password.length >= 8
                                "
                                variant="success"
                                disabled
                                ><b-icon-check
                            /></b-button>
                            <b-button v-else variant="danger" disabled><b-icon-x /></b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>

                <b-form-group
                    label="Name"
                    :label-for="
                        signUpForm.firstName && !signUpForm.surname
                            ? 'surnameInput'
                            : 'firstNameInput'
                    "
                >
                    <b-input-group>
                        <b-form-input
                            id="firstNameInput"
                            v-model="signUpForm.firstName"
                            type="text"
                            placeholder="First Name"
                            required
                            :disabled="isCreating"
                        />
                        <b-form-input
                            id="surnameInput"
                            v-model="signUpForm.surname"
                            type="text"
                            placeholder="Last Name"
                            required
                            :disabled="isCreating"
                        />
                    </b-input-group>
                </b-form-group>

                <b-form-group label="Date of Birth" label-for="dobInput">
                    <b-form-input
                        id="dobInput"
                        v-model="signUpForm.dob"
                        type="date"
                        required
                        :disabled="isCreating"
                    />
                </b-form-group>

                <b-form-group label="Gender">
                    <div class="text-center">
                        <b-form-radio-group
                            v-model="signUpForm.gender"
                            :options="genders"
                            buttons
                            :disabled="isCreating"
                        />
                    </div>
                </b-form-group>

                <b-form-group label="Country" label-for="countryInput">
                    <b-form-select
                        id="countryInput"
                        v-model="signUpForm.country"
                        :options="countryList"
                        :disabled="isCreating"
                    />
                </b-form-group>

                <b-form-group>
                    <b-form-checkbox inline required name="termsCheckbox" :disabled="isCreating">
                        I agree to the
                        <a href="#" target="_blank">Terms and Conditions</a>.
                    </b-form-checkbox>
                </b-form-group>

                <div class="text-center">
                    <b-button type="submit" variant="primary" :disabled="isCreating">
                        <span v-if="!isCreating">Sign Up</span>
                        <span v-else><b-spinner small/></span>
                    </b-button>
                </div>
            </b-form>
        </div>
        <div v-else-if="progressAmount === 50">
            <b-form @submit.prevent="verifyEmail">
                <b-form-group label="Verification Code" label-for="verificationInput">
                    <b-form-input
                        if="verificationInput"
                        v-model="verificationCode"
                        type="text"
                        required
                    />
                </b-form-group>

                <div class="text-center">
                    <b-button
                        variant="outline-dark"
                        @click="resendVerification"
                        :disabled="isResending"
                    >
                        <span v-if="!isResending">Resend</span>
                        <span v-else><b-spinner small/></span>
                    </b-button>
                    <b-button type="submit" variant="primary" :disabled="isVerifying">
                        <span v-if="!isVerifying">Verify Email</span>
                        <span v-else><b-spinner small/></span>
                    </b-button>
                </div>
            </b-form>
        </div>
        <div v-else-if="progressAmount === 86">
            <b-form @submit.prevent="finaliseSignUp">
                <div class="text-center">
                    <div v-if="editingImage">
                        <AvatarEditor
                            :inputImage="fileInput"
                            @addImage="addImage"
                            @cancelEdit="cancelImageEdit"
                        />
                    </div>
                    <b-form-group description="Upload profile photo (optional)">
                        <div v-if="!editingImage">
                            <label for="profilePhotoUpload">
                                <b-avatar
                                    v-if="!imageURL"
                                    size="9rem"
                                    class="profilePhotoUploadAvatar"
                                />
                                <b-avatar
                                    v-else
                                    size="9rem"
                                    class="profilePhotoUploadAvatar"
                                    :src="imageURL"
                                />
                            </label>
                        </div>
                        <b-form-file
                            class="d-none"
                            v-model="fileInput"
                            @change="handleFileUpload"
                            id="profilePhotoUpload"
                        />
                    </b-form-group>
                </div>

                <b-form-group label="Measurement">
                    <div class="text-center">
                        <b-form-radio-group
                            v-model="finalSignUpForm.metric"
                            :options="measurements"
                            buttons
                            :disabled="isFinalising"
                        />
                    </div>
                </b-form-group>

                <b-form-group
                    label="Height and Weight (optional)"
                    :label-for="
                        finalSignUpForm.height && !finalSignUpForm.weight
                            ? 'weightInput'
                            : 'heightInput'
                    "
                >
                    <b-input-group>
                        <b-form-input
                            id="heightInput"
                            v-model="finalSignUpForm.height"
                            type="text"
                            required
                            :disabled="isFinalising"
                        />
                        <b-input-group-addon is-text>{{
                            finalSignUpForm.metric ? "cm" : "inches"
                        }}</b-input-group-addon>
                        <b-form-input
                            id="weightInput"
                            v-model="finalSignUpForm.weight"
                            type="text"
                            required
                            :disabled="isFinalising"
                        />
                        <b-input-group-addon is-text>{{
                            finalSignUpForm.metric ? "kg" : "lbs"
                        }}</b-input-group-addon>
                    </b-input-group>
                </b-form-group>

                <div class="text-center">
                    <b-button type="submit" variant="primary" :disabled="isFinalising">
                        <span v-if="!isFinalising">Get Started!</span>
                        <span v-else><b-spinner small/></span>
                    </b-button>
                </div>
            </b-form>
        </div>
    </div>
</template>

<script>
import { db } from "@/firebase";
import { Auth, Storage, API } from "aws-amplify";

import dayjs from "dayjs";
import crypto from "crypto";
import util from "util";

import AvatarEditor from "@/components/Utility/AvatarEditor.vue";

export default {
    name: "SignUpForm",
    components: { AvatarEditor },
    data() {
        return {
            isCreating: false,
            isVerifying: false,
            isFinalising: false,
            isResending: false,

            imageURL: null,
            fileInput: null,

            signUpForm: {
                username: "",
                email: "",
                pasword: "",
                confPassword: "",
                firstName: "",
                surname: "",
                gender: "male",
                dob: "",
                country: "United States"
            },

            finalSignUpForm: {
                profilePhoto: "",
                height: "",
                weight: "",
                metric: true
            },

            usernameUnique: false,
            checkingUsername: false,
            verifyingEmail: false,

            // Cognito:
            userPool: null,
            verificationCode: "",
            cognitoUsername: "",

            // Bootstrap:
            countryList: [
                "Afghanistan",
                "Albania",
                "Algeria",
                "American Samoa",
                "Andorra",
                "Angola",
                "Anguilla",
                "Antarctica",
                "Antigua and Barbuda",
                "Argentina",
                "Armenia",
                "Aruba",
                "Australia",
                "Austria",
                "Azerbaijan",
                "Bahamas (the)",
                "Bahrain",
                "Bangladesh",
                "Barbados",
                "Belarus",
                "Belgium",
                "Belize",
                "Benin",
                "Bermuda",
                "Bhutan",
                "Bolivia (Plurinational State of)",
                "Bonaire,int Eustatius and Saba",
                "Bosnia and Herzegovina",
                "Botswana",
                "Bouvet Island",
                "Brazil",
                "British Indian Ocean Territory (the)",
                "Brunei Darussalam",
                "Bulgaria",
                "Burkina Faso",
                "Burundi",
                "Cabo Verde",
                "Cambodia",
                "Cameroon",
                "Canada",
                "Cayman Islands (the)",
                "Central African Republic (the)",
                "Chad",
                "Chile",
                "China",
                "Christmas Island",
                "Cocos (Keeling) Islands (the)",
                "Colombia",
                "Comoros (the)",
                "Congo (the Democratic Republic of the)",
                "Congo (the)",
                "Cook Islands (the)",
                "Costa Rica",
                "Croatia",
                "Cuba",
                "Curaçao",
                "Cyprus",
                "Czechia",
                "Côte d'Ivoire",
                "Denmark",
                "Djibouti",
                "Dominica",
                "Dominican Republic (the)",
                "Ecuador",
                "Egypt",
                "El Salvador",
                "Equatorial Guinea",
                "Eritrea",
                "Estonia",
                "Eswatini",
                "Ethiopia",
                "Falkland Islands (the) [Malvinas]",
                "Faroe Islands (the)",
                "Fiji",
                "Finland",
                "France",
                "French Guiana",
                "French Polynesia",
                "French Southern Territories (the)",
                "Gabon",
                "Gambia (the)",
                "Georgia",
                "Germany",
                "Ghana",
                "Gibraltar",
                "Greece",
                "Greenland",
                "Grenada",
                "Guadeloupe",
                "Guam",
                "Guatemala",
                "Guernsey",
                "Guinea",
                "Guinea-Bissau",
                "Guyana",
                "Haiti",
                "Heard Island and McDonald Islands",
                "Holy See (the)",
                "Honduras",
                "Hong Kong",
                "Hungary",
                "Iceland",
                "India",
                "Indonesia",
                "Iran (Islamic Republic of)",
                "Iraq",
                "Ireland",
                "Isle of Man",
                "Israel",
                "Italy",
                "Jamaica",
                "Japan",
                "Jersey",
                "Jordan",
                "Kazakhstan",
                "Kenya",
                "Kiribati",
                "Korea (the Democratic People's Republic of)",
                "Korea (the Republic of)",
                "Kuwait",
                "Kyrgyzstan",
                "Lao People's Democratic Republic (the)",
                "Latvia",
                "Lebanon",
                "Lesotho",
                "Liberia",
                "Libya",
                "Liechtenstein",
                "Lithuania",
                "Luxembourg",
                "Macao",
                "Madagascar",
                "Malawi",
                "Malaysia",
                "Maldives",
                "Mali",
                "Malta",
                "Marshall Islands (the)",
                "Martinique",
                "Mauritania",
                "Mauritius",
                "Mayotte",
                "Mexico",
                "Micronesia (Federated States of)",
                "Moldova (the Republic of)",
                "Monaco",
                "Mongolia",
                "Montenegro",
                "Montserrat",
                "Morocco",
                "Mozambique",
                "Myanmar",
                "Namibia",
                "Nauru",
                "Nepal",
                "Netherlands (the)",
                "New Caledonia",
                "New Zealand",
                "Nicaragua",
                "Niger (the)",
                "Nigeria",
                "Niue",
                "Norfolk Island",
                "Northern Mariana Islands (the)",
                "Norway",
                "Oman",
                "Pakistan",
                "Palau",
                "Palestine,tate of",
                "Panama",
                "Papua New Guinea",
                "Paraguay",
                "Peru",
                "Philippines (the)",
                "Pitcairn",
                "Poland",
                "Portugal",
                "Puerto Rico",
                "Qatar",
                "Republic of North Macedonia",
                "Romania",
                "Russian Federation (the)",
                "Rwanda",
                "Réunion",
                "Saint Barthélemy",
                "Saint Helena,scension and Tristan da Cunha",
                "Saint Kitts and Nevis",
                "Saint Lucia",
                "Saint Martin (French part)",
                "Saint Pierre and Miquelon",
                "Saint Vincent and the Grenadines",
                "Samoa",
                "San Marino",
                "Sao Tome and Principe",
                "Saudi Arabia",
                "Senegal",
                "Serbia",
                "Seychelles",
                "Sierra Leone",
                "Singapore",
                "Sint Maarten (Dutch part)",
                "Slovakia",
                "Slovenia",
                "Solomon Islands",
                "Somalia",
                "South Africa",
                "South Georgia and the South Sandwich Islands",
                "South Sudan",
                "Spain",
                "Sri Lanka",
                "Sudan (the)",
                "Suriname",
                "Svalbard and Jan Mayen",
                "Sweden",
                "Switzerland",
                "Syrian Arab Republic",
                "Taiwan",
                "Tajikistan",
                "Tanzania,nited Republic of",
                "Thailand",
                "Timor-Leste",
                "Togo",
                "Tokelau",
                "Tonga",
                "Trinidad and Tobago",
                "Tunisia",
                "Turkey",
                "Turkmenistan",
                "Turks and Caicos Islands (the)",
                "Tuvalu",
                "Uganda",
                "Ukraine",
                "United Arab Emirates (the)",
                "United Kingdom",
                "United States",
                "Uruguay",
                "Uzbekistan",
                "Vanuatu",
                "Venezuela (Bolivarian Republic of)",
                "Vietnam",
                "Virgin Islands (British)",
                "Virgin Islands (U.S.)",
                "Wallis and Futuna",
                "Western Sahara",
                "Yemen",
                "Zambia",
                "Zimbabwe",
                "Åland Islands"
            ],
            genders: [
                { text: "Male", value: "male" },
                { text: "Female", value: "female" },
                { text: "Other", value: "other" }
            ],
            measurements: [
                { text: "Metric", value: true },
                { text: "Imperial", value: false }
            ],
            editingImage: false,
            progressAmount: 15
        };
    },

    computed: {
        usernameWatcherHandler: function() {
            return this.signUpForm.username;
        }
    },

    created: function() {
        console.log(this.$store.state.apiName);
    },

    methods: {
        handleFileUpload: function(e) {
            this.fileInput = e.target.files[0];
            this.$nextTick(() => {
                this.editingImage = true;
            });
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

        signUp: async function() {
            try {
                this.isCreating = true;

                // First build user in database.
                const user = await Auth.signUp({
                    username: this.signUpForm.username,
                    password: this.signUpForm.password,
                    attributes: {
                        email: this.signUpForm.email,
                        birthdate: dayjs(this.signUpForm.dob).format("YYYY-MM-DD"),
                        gender: this.signUpForm.gender,
                        given_name: this.signUpForm.firstName,
                        family_name: this.signUpForm.surname,
                        locale: this.signUpForm.country
                    }
                });

                this.cognitoUsername = user.user.username;
                this.isCreating = false;
                this.progressAmount = 50;
            } catch (err) {
                console.error("Error creating user!");
            }
        },

        verifyEmail: async function() {
            this.isVerifying = true;

            await Auth.confirmSignUp(this.cognitoUsername, this.verificationCode);
            const user = await Auth.signIn(this.signUpForm.username, this.signUpForm.password);
            await this.$store.dispatch("fetchUser", user.signInUserSession);
            this.isVerifying = false;
            this.progressAmount = 86;
        },

        finaliseSignUp: async function() {
            try {
                // Try upload profilePhoto.
                // TODO: Image doesn't get uploaded.
                this.isFinalising = true;
                this.finalSignUpForm.profilePhoto = await this.uploadProfilePhoto(
                    this.imageURL,
                    this.signUpForm.username
                );

                const path = "/user/" + this.$store.state.userProfile.docData.username;
                const myInit = {
                    headers: {
                        Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                    },
                    body: {
                        userForm: this.finalSignUpForm
                    }
                };

                await API.put(this.$store.state.apiName, path, myInit);
                // Fetch user data again.
                await this.$store.dispatch("fetchUser", this.$store.state.userProfile.data);

                this.isFinalising = false;
                this.$emit("closeSignUpModal");
            } catch (err) {
                console.error("Image upload error", err);
            }
        },

        uploadProfilePhoto: async function(image, username) {
            if (!image) {
                return "";
            }

            const imageName =
                "profilePhotos/" +
                username +
                "/" +
                dayjs().format("YYYYMMDDHHmmssSSS") +
                "-" +
                (await this.generateId(8));
            const imageData = await fetch(image);
            const blob = await imageData.blob();

            const result = await Storage.put(imageName, blob, {
                level: "protected",
                contentType: blob.type,
                progressCallback: function(progress) {
                    console.log(
                        "IMAGE UPLOAD PROGRESS:",
                        progress.loaded,
                        progress.total,
                        progress.loaded / progress.total
                    );
                }
            }).catch(err => {
                throw new Error("Error uploading image: " + err);
            });

            console.log("IMAGE UPLOADED:", result);
            return result.key;
        },

        resendVerification: function() {
            this.isResending = true;

            Auth.resendSignUp(this.cognitoUsername)
                .then(() => {
                    console.log("Verification sent again.");
                    this.isResending = false;
                })
                .catch(err => {
                    alert(err.message || JSON.stringify(err));
                });
        },

        selectCountry: function(country) {
            this.signUpForm.country = country;
        },

        generateId: async function(n) {
            const randomBytes = util.promisify(crypto.randomBytes);
            const rawBytes = await randomBytes(n);

            return rawBytes.toString("hex");
        }
    },

    watch: {
        usernameWatcherHandler: function() {
            if (this.signUpForm.username.trim() !== "") {
                this.checkingUsername = true;

                db.collection("users")
                    .where("username", "==", this.signUpForm.username)
                    .get()
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
                    });
            } else {
                this.usernameUnique = false;
            }
        }
    }
};
</script>

<style scoped>
.profilePhotoUploadAvatar:hover,
#countryInput:hover {
    cursor: pointer;
}

.font-size-8 {
    font-size: 12px;
}
</style>
