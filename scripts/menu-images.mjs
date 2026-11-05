import {menuData} from './menu-data.mjs';
const images={
  picar:['chicharrones','tomate-melva','ensaladilla-pulpo','berenjenas-miel','queso-tabla','tomate-cordobes','picada-criolla','provolone-horno','ensaladilla-melva','croquetas-pollo-jamon','flamenquin'],
  parrilla:['brocheta-pollo','brocheta-solomillo','churrasco-pollo','solomillo-cerdo','pluma-iberica','lagarto-iberico','costilla-barbacoa','entrecot-ternera','chuleton-servido'],
  mar:['pulpo-plato','calamar-plato','langostinos-plato','atun-plancha'],
  dulce:['tarta-queso-nueva','brownie-chocolate','postre-dia'],
  peques:['lagrimitas-pollo','pechuga-pollo']
};
export const photoMenu=menuData.flatMap(([category,,,items])=>items.map(([es,en,price,description='',english=''],index)=>{
  const image=images[category][index];if(!image)throw new Error(`Missing image for ${es}`);
  if(image==='postre-dia'){description='Imagen orientativa. Consulta el postre disponible hoy.';english='Illustrative image. Ask about today’s dessert.'}
  return [category,image,es,en,price?(price.includes('/ 100')?'6,00 € / 100 g':price+' €'):null,description,english];
}));
photoMenu.push(
  ['picar','croquetas-plato','Croquetas de morcilla','Black pudding croquettes',null,'Con cebolla caramelizada.','With caramelised onion.'],
  ['picar','ensalada-cabra','Ensalada de queso de cabra','Goat cheese salad',null,'Una de nuestras especialidades.','One of our specialities.'],
  ['parrilla','parrillada','Parrillada','Mixed grill',null,'Consulta la selección del día.','Ask about today’s selection.']
);
const order=menuData.map(([id])=>id);photoMenu.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
