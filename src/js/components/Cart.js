import {select, classNames, templates, settings} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';
class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      // console.log('new Cart: ', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
       thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      })
    }
    add(menuProduct){
      const thisCart = this;

      // console.log('adding product: ', menuProduct);
      const generatedHTML = templates.cartProduct(menuProduct);
      // generate HTML based on template 
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      // create element using utils.createElementFromHTML
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('thisCart.products', thisCart.products);
      thisCart.update();
    }
    update(){
      const thisCart = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0;
      let subtotalPrice = 0;
      for(let product of thisCart.products){
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }
    //   thisCart.totalPrice = subtotalPrice + (subtotalPrice ? deliveryFee : 0);
    //   thisCart.dom.totalNumber.innerHTML = totalNumber;
    //   thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    //   for(let priceElem of thisCart.dom.totalPrice){
    //     priceElem.innerHTML = thisCart.totalPrice;
    //   }
    //   thisCart.dom.deliveryFee.innerHTML = subtotalPrice ? deliveryFee : 0;
    // }
      if(subtotalPrice !== 0){
        thisCart.totalPrice = subtotalPrice + deliveryFee;
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        for(const elem of thisCart.dom.totalPrice){
        elem.innerHTML = thisCart.totalPrice;
        }
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    }else if(subtotalPrice == 0){
      thisCart.totalPrice = 0;
      for(const elem of thisCart.dom.totalPrice){
        elem.innerHTML = thisCart.totalPrice;
        }
      thisCart.dom.deliveryFee.innerHTML = 0;
    }
    
    // thisCart.dom.totalNumber.innerHTML = totalNumber;
    // thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
    // thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    // thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    // console.log('totalNumber: ', totalNumber);
    // console.log('subtotalPrice: ', subtotalPrice);
    // console.log('totalPrice: ', thisCart.totalPrice);
  }
  remove(cartProduct) {
    const thisCart = this;

    const index = thisCart.products.indexOf(cartProduct);
    if (index !== -1) {
      thisCart.products.splice(index, 1);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
    }
  }
  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: []
    };
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    fetch(url, options);
  }
}

export default Cart;