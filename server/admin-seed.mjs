import { photoMenu } from '../scripts/menu-images.mjs';
export const categories = [
 {id:'picar',es:'Para empezar',en:'To start'}, {id:'parrilla',es:'Nuestra parrilla',en:'From our grill'},
 {id:'mar',es:'Del mar',en:'From the sea'}, {id:'dulce',es:'Un final dulce',en:'Something sweet'}, {id:'peques',es:'Para los pequeños',en:'For little ones'}
];
export function seedProducts(){return photoMenu.map(([category,image,name,nameEn,price,description,descriptionEn],index)=>({id:`dish-${index+1}`,category,name,nameEn,description,descriptionEn,price:price?Number(price.match(/[\d,]+/)[0].replace(',','.')):null,unit:price?.includes('/ 100')?'100g':'portion',image:`assets/images/${image}.webp`,active:true,order:index,version:1}));}
export const initialState=()=>({schema:1,products:seedProducts(),bookings:[],limits:{},audit:[]});
