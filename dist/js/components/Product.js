import {select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }
    renderInMenu(){
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // generate HTML based on template 
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // create element using utils.createElementFromHTML
      const menuContainer = document.querySelector(select.containerOf.menu);
      // find menu container 
      menuContainer.appendChild(thisProduct.element);
      // add element to menu 
    }
    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion(){
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
    /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      /* prevent default action for event */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      /* find active product (product that has active class) */
      if(activeProduct && activeProduct !== thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      /* toggle active class on thisProduct.element */
    });
    }
    initOrderForm(){
      const thisProduct = this;
      // console.log('initOrderFrom');
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder(){
      const thisProduct = this;
      // console.log('processOrder');
      const formData = utils.serializeFormToObject(thisProduct.form);
      // console.log('formData', formData);
      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);

        // for every option in this category
          for(let optionId in param.options) {
            // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
            const option = param.options[optionId];
            // console.log(optionId, option);
            const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
            const optionImage = thisProduct.imageWrapper.querySelector('.'+paramId+'-'+optionId);
            if(optionSelected){
              if(!option.default){
                price += option.price;
              }
            }else {
              if(option.default){
                price -= option.price;
              }
            }
            if(optionImage){
              if(optionSelected){
                optionImage.classList.add('active');
              }else{
                optionImage.classList.remove('active');
              }
            }
          }
        }
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.price = price;
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }
    addToCart(){
      const thisProduct = this;

      const productSummary = thisProduct.prepareCartProduct();

      const event = new CustomEvent('add-to-cart', {
        bubbles: true,
        detail: {
            product: productSummary,
        }
      });
      thisProduct.element.dispatchEvent(event);
    //   app.cart.add(productSummary);
    }
    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.price,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }
    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        }
        // console.log(paramId, param);

        // for every option in this category
          for(let optionId in param.options) {
            // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
            const option = param.options[optionId];
            // console.log(optionId, option);
            const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
            if(optionSelected){
              params[paramId].options[optionId] = option.label;
            }
          }
       }
       return params;
     }
    }

    export default Product;