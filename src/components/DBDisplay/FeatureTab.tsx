// React & React Router & React Query Modules
import React, { useState, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import { NavLink } from 'react-router-dom';

const linkbtn = 'mt-4 inline-block lg:mt-0 text-blue-200 hover:text-white mr-4';

// Functions imported:
import parseSql from '../../parse';
// Stores imported:
import logo from '../../assets/newLogoWhite.png';
import useSchemaStore from '../../store/schemaStore';
import useFlowStore from '../../store/flowStore';
import useSettingsStore from '../../store/settingsStore';
import useCredentialsStore from '../../store/credentialsStore';
//import icon
import { Home, ConnectDatabase, UploadSQLFile, ExportQuery, AddTable, DeleteTable, ClearCanvas, Undo, Redo, SaveDatabase, LoadDatabase, SignOut, BuildDatabase } from '../../FeatureTabIcon';
// Components imported:
import QueryModal from '../Modals/QueryModal';
import DbNameInput from '../Modals/DbNameInput';
import LoadDbModal from '../Modals/LoadDbModal';


/** "FeatureTab" Component - a tab positioned in the left of the page to access features of the app; */
export default function FeatureTab(props: any) {
  //STATE DECLARATION (dbSpy3.0)
  const { setEdges, setNodes } = useFlowStore((state) => state);
  const [theme, setTheme] = useState('Light');

  const { schemaStore, setSchemaStore, undoHandler, redoHandler } = useSchemaStore(
    (state) => state
  );
  const { user, setUser } = useCredentialsStore((state: any) => state);

  const { setWelcome, isSchema } = useSettingsStore((state) => state);
  const [action, setAction] = useState(new Array());
  const [queryModalOpened, setQueryModalOpened] = useState(false);
  const [saveDbNameModalOpened, setSaveDbNameModalOpened] = useState(false);
  const [loadDbModalOpened, setLoadDbModalOpened] = useState(false);
  const [nameArr, setNameArr] = useState<string[]>([]);
  //END: STATE DECLARATION

  //create references for HTML elements
  const confirmModal: any = useRef();
  /* When the user clicks, open the modal */
  const openModal: any = (callback: any) => {
    confirmModal.current.style.display = 'block';
    confirmModal.current.style.zIndex = '100';
    setAction([callback]);
  };
  /* When the user clicks 'yes' or 'no', close it */
  const closeModal: any = (response: boolean) => {
    confirmModal.current.style.display = 'none';
    if (response) action[0]();
  };

  // HELPER FUNCTIONS

  const connectDb = () => {
    //if Flow is rendered, openModal
    if (document.querySelector('.flow')) openModal(props.handleSidebar);
    else props.handleSidebar();
  };
  const uploadSQL = () => {
    //if Flow is rendered, openModal
    if (document.querySelector('.flow')) openModal(getSchemaFromFile);
    else getSchemaFromFile();
  };

  const buildDb = () => {
    //if Flow is rendered, open modal
    if (document.querySelector('.flow')) openModal(buildDatabase);
    else buildDatabase();
  };

  const clearCanvas = () => {
    //if Flow is rendered, open modal
    if (document.querySelector('.flow')) openModal(clearCanvasTables);
    else clearCanvasTables();
  };

  const getSchemaFromFile = () => {
    // creating an input element for user to upload sql file
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();
    input.onchange = (e: any): void => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (event: any) => {
        //Parse the .sql file into a data structure that is same as "fetchedData" and store it into a variable named "parsedData"
        const parsedData: any = parseSql(event.target.result);
        setSchemaStore(parsedData);
        setWelcome(false);
      };
    };
  };

  const buildDatabase = () => {
    setNodes([]);
    setEdges([]);
    setWelcome(false);
  };

  const clearCanvasTables = () => {
    setSchemaStore({});
    setEdges([]);
    setNodes([]);
    setWelcome(false);
  };

  // Export QueryModal
  const openQueryModal = () => {
    setQueryModalOpened(true);
  };
  const closeQueryModal = () => {
    setQueryModalOpened(false);
  };

  //SaveDbNameModal
  const openSaveDbNameModal = () => {
    if (!user) alert('Must sign in to save!');
    else {
      setSaveDbNameModalOpened(true);
    }
  };

  const closeSaveDbNameModal = (input?: string) => {
    //pull dbName from input field and send it to the database along with the schema.
    if(input){
      saveSchema(input);
    }
    setSaveDbNameModalOpened(false);
  };
 
  // LoadDbModal
  // Open loadDbName Modal and send get request to database to get&list all the databases name.
  const openLoadDbModal = async (): Promise<string[]> => {
    buildDatabase();
    if (!user) {
      alert('Must sign in to save!');
      return Promise.reject('User not signed in');
    } else {
      const response = await axios
        .get<string[]>('/api/saveFiles/allSave')
        .then((res: AxiosResponse) => {
          const nameArr = [];
          for (let saveName of res.data.data) {
            nameArr.push(saveName.SaveName);
          }
          setLoadDbModalOpened(true);
          setNameArr(nameArr);
        })
        .catch((err) => {
          console.error('Err', err);
          return Promise.reject(err);
        });
    }
    return [];
  };

  const closeLoadDbModal = (input?: string) => {
    if(input){
      loadSchema(input);
    }
    setLoadDbModalOpened(false);
  };

  // Temp
  const saveSchema = (inputName: string): void => {
    //check to see if a table is present in the schemaStore
    if (Object.keys(schemaStore).length !== 0) {
      //Create request body with the schema to be saved and the inputted name to save it under
      const postBody = {
        schema: JSON.stringify(schemaStore),
        SaveName: inputName,
      };
      //make a get request to see if the name already exists in the database
      axios
        .get<string[]>('/api/saveFiles/allSave')
        .then((res: AxiosResponse) => {
          const nameArr = [];
          for (let saveName of res.data.data) {
            nameArr.push(saveName.SaveName);
          }
          // if the name already exists then send to one route and if not then send to the other
          // route with combined middleware.
          if (nameArr.includes(inputName)) {
            axios
              .patch('/api/saveFiles/save', postBody)
              .catch((err) => console.error('err', err));
          } else {
            axios
              .post('/api/saveFiles/CreateAndSave', postBody)
              .catch((err) => console.error('err', err));
          }
        })
        .catch((err) => console.error('Err', err));
    } else {
      //if no table is present, send alert to the user
      alert('No schema displayed.');
    }
  };

  const loadSchema = async (inputName: string) => {
    try {
      //send the inputName along with the get request as query in the parameters.
      const data = await fetch(`/api/saveFiles/loadSave?SaveName=${inputName}`);
      if (data.status === 204) return alert('No database stored!');
      const schemaString = await data.json();
      return setSchemaStore(JSON.parse(schemaString.data));
    } catch (err) {
      console.log(err);
      console.error('err retrieve', err);
      window.alert(err);
    }
  };

  // Clears session + reset store
  const signoutSession = async () => {
    await fetch(`/api/logout`);
    window.open('/', '_self');
    setSchemaStore({});
    setUser(null);
  };

  //Toggle function for DarkMode
  const toggleClass = (): void => {
    const page = document.getElementById('body');
    page!.classList.toggle('dark');
    theme === 'Dark' ? setTheme('Light') : setTheme('Dark');
  };

  // END: HELPER FUNCTIONS

  return (
    <>
      {/* PAGE */}
      <div className="mx-auto max-w-2xl">
        <aside
          className="featureTab light:bg-sky-800 absolute inset-y-0 left-0 top-24 w-64"
          aria-label="FeatureTab"
        >
          <div className="menuBar light:bg-sky-800 overflow-y-auto  rounded px-3 py-4 shadow-lg transition-colors duration-500 dark:bg-black">
            {theme === 'Light' ? (
              <img
                className="mb-4 mt-12 inline-block h-[45] h-[88px] w-[200px] fill-current  pl-7"
                src={logo}
                alt="Logo"
              />
            ) : (
              <img
                className="mb-4 mt-12 inline-block h-[45] h-[88px] w-[200px] pl-7 invert filter"
                src={logo}
                alt="Logo"
              />
            )}

            <NavLink to="/" className={linkbtn}>
              <div className="inline-flex h-10 w-[232px] items-center justify-start gap-3 rounded-lg py-2 pl-1 pr-[54.52px]">
                {/* width="28" height="28" viewBox="0 0 35 28" fill="none"   */}
                <Home/>
                <div className="inline-flex flex-col items-start justify-start pr-[2.48px]">
                  <div className="text-slate-900 dark:text-[#f8f4eb]">Home</div>
                </div>
              </div>
            </NavLink>

            <button onClick={toggleClass}>
              <div className="ItemLink inline-flex h-10 w-[232px] items-center justify-start gap-0 rounded-lg py-2 pl-0 pr-0">
                <svg
                  fill="black"
                  viewBox="0 0 24 24"
                  className="white:invert ml-2 mr-2 inline-block h-[25] rounded-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.50488 10.7569C1.50488 16.4855 6.14803 21.1294 11.8756 21.1294C16.2396 21.1294 19.974 18.4335 21.5049 14.616C20.3104 15.0962 19.0033 15.3668 17.6372 15.3668C11.9095 15.3668 7.26642 10.7229 7.26642 4.99427C7.26642 3.63427 7.53299 2.3195 8.00876 1.12939C4.19637 2.66259 1.50488 6.39536 1.50488 10.7569Z"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div className="DarkMode text-base leading-normal dark:text-white">
                  {theme} Mode
                </div>
              </div>
            </button>

            <p className="mt-7 text-slate-900 dark:text-[#f8f4eb]">Action</p>
            <hr />
            <ul className="space-y-2">
              <li>
                <a
                  onClick={connectDb}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                  data-testid="connect-database"
                >
                  <ConnectDatabase/>
                  <span className="ml-3">Connect Database</span>
                </a>
              </li>
              <li>
                <a
                  onClick={uploadSQL}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <UploadSQLFile/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Upload SQL File</span>
                  <span className="ml-3 inline-flex items-center justify-center rounded-full bg-gray-200 px-2 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"></span>
                </a>
              </li>
              <li>
                <a
                  onClick={buildDb}
                  className=" flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <BuildDatabase/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Build Database</span>
                </a>
              </li>
              {/* TODO: Add SAVE feature */}
              <li>
                <a
                  onClick={openQueryModal}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <ExportQuery/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Export Query</span>
                </a>
              </li>
              <br />
              <p className="text-slate-900 dark:text-[#f8f4eb]">Edit</p>
              <hr />
              {isSchema ? (
                <li>
                  <a
                    onClick={() => {
                      props.openAddTableModal();
                      // if schemaStore is empty, initialize
                      if (!Object.keys(schemaStore).length) buildDatabase();
                    }}
                    id="addTable"
                    className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                  >
                    <AddTable/>
                    <span className="ml-3 flex-1 whitespace-nowrap">Add Table</span>
                  </a>
                </li>
              ) : null}
              {Object.keys(schemaStore).length ? (
                <li>
                  <a
                    onClick={() => {
                      props.openDeleteTableModal();
                    }}
                    id="deleteTable"
                    className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                  >
                    <DeleteTable/>
                    <span className="ml-3 flex-1 whitespace-nowrap">Delete Table</span>
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  onClick={clearCanvas}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <ClearCanvas/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Clear Canvas</span>
                </a>
              </li>
              {/* TODO: Add UNDO & REDO feature */}
              <li>
                <a
                  onClick={undoHandler}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <Undo/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Undo</span>
                </a>
              </li>
              <li>
                <a
                  onClick={redoHandler}
                  className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                >
                  <Redo/>
                  <span className="ml-3 flex-1 whitespace-nowrap">Redo</span>
                </a>
              </li>
            </ul>
            <br />
            <div className="historyBlock">
              <p className="text-slate-900 dark:text-[#f8f4eb]">Account</p>
              <hr />
              <ul className="space-y-2">
                <li>
                  <a
                    onClick={openSaveDbNameModal}
                    className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                  >
                    <SaveDatabase/>
                    <span className="ml-3 flex-1 whitespace-nowrap">Save Database</span>
                  </a>
                </li>
                <li>
                  <a
                    onClick={openLoadDbModal}
                    className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                  >
                    <LoadDatabase/>
                    <span className="ml-3 flex-1 whitespace-nowrap">Load Database</span>
                  </a>
                </li>
                {user ? (
                  <li>
                    <a
                      onClick={() => signoutSession()}
                      className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-[#f8f4eb] dark:hover:bg-gray-700"
                    >
                      <SignOut/>
                      <span className="ml-3 flex-1 whitespace-nowrap">Sign Out</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </aside>

        {/* MODALS */}

        {/* MODAL FOR CONFIRMATION POPUP */}
        <div ref={confirmModal} id="confirmModal" className="confirmModal">
          {/* <!-- Confirm Modal content --> */}
          <div className="modal-content w-[30%] min-w-[300px] max-w-[550px] content-center rounded-md border-0 bg-[#f8f4eb] shadow-[0px_5px_10px_rgba(0,0,0,0.4)] dark:bg-slate-800 dark:shadow-[0px_5px_10px_#1e293b]">
            <p className="mb-4 text-center text-slate-900 dark:text-[#f8f4eb]">
              Are you sure you want to proceed? You will lose <strong>ALL</strong> unsaved changes.
            </p>
            <div className="mx-auto flex w-[50%] max-w-[200px] justify-between">
              <button
                onClick={() => closeModal(true)}
                className="modalButton text-slate-900 hover:opacity-70 dark:text-[#f8f4eb]"
              >
                Confirm
              </button>
              <button
                onClick={() => closeModal(false)}
                className="modalButton text-slate-900 hover:opacity-70 dark:text-[#f8f4eb]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Query Output Modal */}

        {queryModalOpened ? <QueryModal closeQueryModal={closeQueryModal} /> : null}
        {saveDbNameModalOpened ? (<DbNameInput closeSaveDbNameModal={closeSaveDbNameModal}/>) : null}
        {loadDbModalOpened ? (<LoadDbModal nameArr={nameArr} closeLoadDbModal={closeLoadDbModal} />) : null}
      </div>
    </>
  );
}
