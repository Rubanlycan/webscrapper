import React, { useState } from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import axios from 'axios';

function App() {
  const [excelData, setExcelData] = useState([]);
  const [productData,setProductData] = useState([])
  const [processed,setProcessed] = useState(-1)
  const [filesProcessed,setFileProcessed] = useState(0)
  const [clickable,setClickable] = useState(true)

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const binaryString = event.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });

        // Assuming the first sheet is the one we want to process
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert the sheet to JSON format
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const flattenedUniqueArray = [...new Set(data.flat())];
  
        // Set the data to the state
        setExcelData(flattenedUniqueArray);
        setFileProcessed(0)
      };

      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let updateProduct = []
    setClickable(false)
     setProcessed(0)
   const totalData = excelData.length; // Total number of items
          let completedRequests = 0
     const promises = excelData.map(async (val, index) => {
    
      
        try {
          
          const response = await axios.get('https://scapper-backend-9ull.onrender.com/scrape', {
            params: {
              url:`https://${val}`
            }
          });

          console.log('Filtered Data:', response.data);
          updateProduct.push(response.data)
    
          if(index===excelData.length-1)
          setProcessed(1)
          completedRequests++;
          const progress = Math.min(100, Math.floor((completedRequests / totalData) * 100)); // Ensure it's capped at 100
          setFileProcessed(progress); // Update progress
        } catch (error) {
          completedRequests++;
          const progress = Math.min(100, Math.floor((completedRequests / totalData) * 100)); // Ensure it's capped at 100
          setFileProcessed(progress);
          console.error('Error fetching data:', error);
          updateProduct.push({title: '', salePrice: '', listItems:[{"point1":""}], url: val, MRP: '',reviews:'',ratings:''})
          if(index===excelData.length-1)
            setProcessed(1)


        }
      })
      console.log('updated',updateProduct)
      await Promise.all(promises);
      setClickable(true)
       setProductData(updateProduct)
 
  };

  const flattenData = productData.map((item) => {
    const flattenedItem = {
      url: item.url,
      title: item.title,
      salePrice: item.salePrice,
      MRP: item.MRP,
      reviews: item.reviews,
      ratings: item.ratings,
 
    };

    item.listItems.forEach((listItem) => {
      const key = Object.keys(listItem)[0]; // Extract the key from listItems like point1, point2
      flattenedItem[key] = listItem[key]; // Add it to the flattened object
    });

    return flattenedItem;
  });

  // Function to export data to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(flattenData); // Convert JSON to sheet
    const wb = XLSX.utils.book_new(); // Create a new workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); // Append the sheet to the workbook

    // Generate file name with date and time for uniqueness
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace(/[-:T]/g, "").split(".")[0]; // Format: YYYYMMDD_HHMMSS
    const fileName = `productDetails_${formattedDate}.xlsx`;

    // Save the Excel file
    XLSX.writeFile(wb, fileName);
  };


const processIndicator =()=>{
  if(processed===1)
    return <button style={{backgroundColor:'green',color:'white',height:40,width:200, borderRadius:20,marginTop:10}} onClick={exportToExcel} >Download</button>
  if(processed===0)
return <h2>Processing ...{filesProcessed}%</h2>

return <></>}

  return (
    <div className="App">
      <header className="App-header">
        <h5>Duplicates entries will be removed automatically</h5>
  <input style={{borderColor:'blue',borderWidth:1}} type="file" accept=".xls, .xlsx" onChange={handleFileUpload}/>
  <button style={{backgroundColor:clickable?'blue':'grey',color:'white',height:40,width:200, borderRadius:20,marginTop:10}} onClick={handleSubmit} disabled={!clickable}>Process</button> 
  {processIndicator()}
 
      </header>
    </div>
  );
}

export default App;
