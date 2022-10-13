import useFetch from "react-fetch-hook";
import { sum, map, identity, round} from "lodash";
import React, { useState } from 'react';
import Container from '@mui/material/Container';
import { useCookies } from 'react-cookie';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

class Recipe {
  constructor(ingredients, array) {
    this.ingredients = ingredients;
    this.array = array;
    Object.freeze(this);
  }
  ingredientsWithQuantity() {
    return this.array.map((quantity, numId)=> {
      if(!(quantity > 0)) return undefined;
      const ingredient = this.ingredients[numId];
      if(!ingredient) return undefined;
      return {ingredient, quantity};
    }).filter(identity);
  }
  property(pname)
  {
    return sum(map(this.array, (quantity,numId)=> {
      const ingredient = this.ingredients[numId];
      if(!ingredient) return 0;
      return ingredient.values[pname] * quantity;
    }));
  }
  withQuantity(ingredient, quantity) {
    const newArray = [...this.array];
    newArray[ingredient.numId] = quantity;
    const norm = sum(newArray);
    return new Recipe(this.ingredients, newArray.map(q=>q/norm));
  }
};

function Card({children}) {
  return <Paper elevation={3} style={{padding:'16px', marginTop:'8px'}}>
    {children}
  </Paper>
}

function VFlex({children, style}) {
  return <div style={{display:'flex', flexDirection:'column', gap: '8px', ...style}}>
    {children}
  </div>
}
function HFlex({children, style}) {
  return <div style={{display:'flex', flexDirection:'row', gap: '8px', ...style}}>
    {children}
  </div>
}


function RecipeView({ingredients}) {
  const mealQuantity = 500;
  const priceDiscount = 0.25;
  const [recipe, setRecipe] = useState(new Recipe(ingredients,[0.25,0,0,0.05,0.25,0,0,0,0,0,0,.25,0,0,0.20]));

  return <>
  <Card>
    <VFlex style={{gap:'16px'}}>
      {recipe.ingredientsWithQuantity().map(({ingredient, quantity})=> {
        return <HFlex style={{gap:'16px'}} key={ingredient.numId}>
          <img src={ingredient.image} style={{
            width:'64px',
            height:'64px',
            objectFit: 'cover',
            borderRadius: '16px'
          }} alt={ingredient.titleEn} />
          <VFlex style={{flex:1}}>
            <HFlex>
              <div>{(round(quantity*100,1))+' % '}</div>
              <div>{ingredient.titleEn.split(',')[0]}</div>
            </HFlex>
            <Slider
              value={quantity}
              onChange={(e,newQuantity)=>setRecipe(recipe.withQuantity(ingredient, newQuantity))}
              step={0.001}
              min={0.001}
              max={Math.max(0.3,quantity)}
            />
          </VFlex>
        </HFlex>
      })}
    </VFlex>
  </Card>
  <Card>
    <div>{(mealQuantity).toFixed(0)+' g'}</div>
    <div>{(recipe.property('price') * mealQuantity * (1-priceDiscount)).toFixed(2)+' €'}</div>
    <div>{(recipe.property('energy') * mealQuantity).toFixed(0)+' kcal'}</div>
    <div>{(recipe.property('protein') * mealQuantity).toFixed(2)+' g of proteins'}</div>
    <div>{(recipe.property('lipid') * mealQuantity).toFixed(2)+' g of lipid'}</div>
    <div>{(recipe.property('carbohydrate') * mealQuantity).toFixed(2)+' g of carbs'}</div>
  </Card>
  </>
}

function AppWithKey({apiKey, onApiError}) {
  const { data, isLoading } = useFetch('https://symphony.fr/api/v1/ingredients?api_key='+apiKey);
  if(!isLoading && data.errors.length > 0) {
    onApiError(data.errors);
    return '';
  }
  const ingredients = isLoading ? undefined : [];
  if(!isLoading) data.data.forEach(ingredient=> { ingredients[ingredient.numId] = ingredient });

  return (
    <>
      <meta name="viewport" content="initial-scale=1, width=device-width" />
        {isLoading ? 'Loading...' : (<>
          
          {/* {false && <Ingredients ingredients={ingredients} />} */}
          <RecipeView ingredients={ingredients} />
        </>)}
    </>
  );
}

function App() {
  const [cookies, setCookie] = useCookies(['apiKey']);
  const [apiKey, setApiKey] = useState(cookies.apiKey);
  return (
    <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <Container maxWidth="sm" style={{padding:'64px 0'}}>
      {apiKey ? <AppWithKey apiKey={apiKey} onApiError={()=>setApiKey()} /> : (
        <form onSubmit={(e)=>{
          const key = document.getElementById('apiKey').value
          setApiKey(key);
          setCookie('apiKey',key);
          e.preventDefault();
        }}>
          <TextField
            name='apiKey'
            id='apiKey'
            label="API key"
          />
          <br />
          <br />
          <Button variant="contained" type='submit' size="large">let me in!</Button>
          <p>Get your API key at: <a href="https://symphony.fr/my-account/api-keys" target="_blank" style={{color:'white'}} rel="noreferrer">symphony.fr/my-account/api-keys</a></p>
        </form>
      )}
    </Container>
    </ThemeProvider>
  );
}

export default App;
